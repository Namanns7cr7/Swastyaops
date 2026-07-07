# Datasets + core tables + scheduled ELT (docs/04_Database_Schema.md §3).

resource "google_bigquery_dataset" "datasets" {
  for_each = {
    swasthyaops_raw       = "Landing: source-shaped (events stream, public datasets)"
    swasthyaops_curated   = "Typed, deduped, partitioned domain tables"
    swasthyaops_ml        = "BQML features, models, predictions"
    swasthyaops_analytics = "Serving views for reports and KPI tiles"
  }
  dataset_id  = each.key
  description = each.value
  location    = var.region
  labels      = local.labels
}

# Streaming landing table for the Pub/Sub BigQuery subscription (pubsub.tf)
resource "google_bigquery_table" "raw_events" {
  dataset_id          = google_bigquery_dataset.datasets["swasthyaops_raw"].dataset_id
  table_id            = "events"
  deletion_protection = var.env == "prod"

  time_partitioning {
    type  = "DAY"
    field = null # _ingest_ts via ingestion-time partitioning
  }

  schema = jsonencode([
    { name = "data", type = "JSON", mode = "NULLABLE", description = "Full event envelope (architecture/event_catalog.md)" },
    { name = "subscription_name", type = "STRING", mode = "NULLABLE" },
    { name = "message_id", type = "STRING", mode = "NULLABLE" },
    { name = "publish_time", type = "TIMESTAMP", mode = "NULLABLE" },
    { name = "attributes", type = "JSON", mode = "NULLABLE" },
  ])
}

# Representative curated table; remaining tables follow the same pattern (docs/04 §3.2)
resource "google_bigquery_table" "inventory_transactions" {
  dataset_id          = google_bigquery_dataset.datasets["swasthyaops_curated"].dataset_id
  table_id            = "inventory_transactions"
  deletion_protection = var.env == "prod"

  time_partitioning {
    type  = "DAY"
    field = "occurred_at"
  }
  require_partition_filter = true
  clustering               = ["district_id", "facility_id"]

  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED" },
    { name = "occurred_at", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "district_id", type = "STRING", mode = "REQUIRED" },
    { name = "facility_id", type = "STRING", mode = "REQUIRED" },
    { name = "item_code", type = "STRING", mode = "REQUIRED" },
    { name = "item_name", type = "STRING", mode = "NULLABLE" },
    { name = "txn_type", type = "STRING", mode = "REQUIRED" },
    { name = "qty", type = "INT64", mode = "REQUIRED" },
    { name = "balance_after", type = "INT64", mode = "NULLABLE" },
    { name = "batch_no", type = "STRING", mode = "NULLABLE" },
    { name = "source", type = "STRING", mode = "NULLABLE" },
    { name = "actor", type = "STRING", mode = "NULLABLE" },
  ])
}

# Hourly ELT: raw.events → curated (idempotent MERGE on event_id; SQL in scripts/sql/).
# DML scheduled queries must not declare a destination dataset — the MERGE names its target.
# The query runs as sa-svc-ingestion; the Data Transfer service agent must be able to
# mint tokens for it, and the SA needs raw read + curated write.

resource "google_project_service_identity" "bq_dts" {
  provider = google-beta
  project  = var.project_id
  service  = "bigquerydatatransfer.googleapis.com"
}

resource "google_service_account_iam_member" "dts_token_creator" {
  service_account_id = google_service_account.services["sa-svc-ingestion"].name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_project_service_identity.bq_dts.email}"
}

resource "google_bigquery_dataset_iam_member" "elt_reads_raw" {
  dataset_id = google_bigquery_dataset.datasets["swasthyaops_raw"].dataset_id
  role       = "roles/bigquery.dataViewer"
  member     = "serviceAccount:${google_service_account.services["sa-svc-ingestion"].email}"
}

resource "google_bigquery_dataset_iam_member" "elt_writes_curated" {
  dataset_id = google_bigquery_dataset.datasets["swasthyaops_curated"].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.services["sa-svc-ingestion"].email}"
}

resource "google_bigquery_data_transfer_config" "elt_inventory" {
  display_name         = "elt-inventory-transactions"
  data_source_id       = "scheduled_query"
  schedule             = "every 1 hours"
  location             = var.region
  service_account_name = google_service_account.services["sa-svc-ingestion"].email
  params = {
    query = file("${path.module}/../../scripts/sql/elt_inventory_transactions.sql")
  }
  depends_on = [
    google_bigquery_table.raw_events,
    google_bigquery_table.inventory_transactions,
    google_service_account_iam_member.dts_token_creator,
    google_bigquery_dataset_iam_member.elt_reads_raw,
    google_bigquery_dataset_iam_member.elt_writes_curated,
  ]
}

# Cost guardrails (docs/02 §5): partition filters are set per-table above;
# maximum_bytes_billed is enforced in the scheduled query SQL via job options.
