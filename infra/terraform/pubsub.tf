# Topics, DLQs, and subscriptions generated from architecture/pubsub_topics.yaml —
# the registry file IS the infrastructure definition (docs/02_TRD.md §3).

locals {
  topics = { for t in local.topic_registry.topics : t.name => t }

  # Flatten push subscriptions (skip type=bigquery, handled separately below)
  push_subs = merge([
    for t in local.topic_registry.topics : {
      for s in try(t.subscribers, []) :
      "${t.name}/${s.subscription}" => {
        topic   = t.name
        name    = s.subscription
        service = s.service
        filter  = try(s.filter, "")
      } if try(s.type, "push") != "bigquery"
    }
  ]...)

  bq_subs = merge([
    for t in local.topic_registry.topics : {
      for s in try(t.subscribers, []) :
      "${t.name}/bq" => { topic = t.name, table = s.table }
      if try(s.type, "") == "bigquery"
    }
  ]...)
}

resource "google_pubsub_topic" "main" {
  for_each                   = local.topics
  name                       = each.key
  labels                     = local.labels
  message_retention_duration = local.topic_registry.defaults.message_retention
}

resource "google_pubsub_topic" "dlq" {
  for_each                   = local.topics
  name                       = "${each.key}.dlq"
  labels                     = merge(local.labels, { kind = "dlq" })
  message_retention_duration = local.topic_registry.defaults.dlq_retention
}

resource "google_pubsub_subscription" "push" {
  for_each = local.push_subs
  name     = each.value.name
  topic    = google_pubsub_topic.main[each.value.topic].id
  labels   = local.labels
  filter   = each.value.filter != "" ? each.value.filter : null

  ack_deadline_seconds       = 60
  enable_message_ordering    = startswith(each.value.topic, "facility.")
  retain_acked_messages      = false

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.services[each.value.service].uri}/internal/pubsub/${split("-", each.value.name)[0]}"
    oidc_token {
      service_account_email = google_service_account.services["sa-${each.value.service}"].email
      audience              = google_cloud_run_v2_service.services[each.value.service].uri
    }
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq[each.value.topic].id
    max_delivery_attempts = local.topic_registry.defaults.max_delivery_attempts
  }
}

# Streaming path to the warehouse — no Dataflow at pilot scale (ADR scope, docs/16 debt #1).
# The Pub/Sub service agent writes the rows, so it needs BigQuery access first.
data "google_project" "current" {}

resource "google_project_iam_member" "pubsub_agent_bq" {
  for_each = toset(["roles/bigquery.dataEditor", "roles/bigquery.metadataViewer"])
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_pubsub_subscription" "bigquery" {
  for_each = local.bq_subs
  name     = "bq-${replace(each.value.topic, ".", "-")}"
  topic    = google_pubsub_topic.main[each.value.topic].id
  labels   = local.labels

  bigquery_config {
    table            = "${var.project_id}.${each.value.table}"
    write_metadata   = true
    use_topic_schema = false # envelope JSON into payload column; ELT normalizes (docs/04 §3.2)
  }

  depends_on = [google_project_iam_member.pubsub_agent_bq, google_bigquery_table.raw_events]

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq[each.value.topic].id
    max_delivery_attempts = local.topic_registry.defaults.max_delivery_attempts
  }
}

# DLQ depth alerting is defined in monitoring.tf (pages after 10 min non-empty, TRD §3).
