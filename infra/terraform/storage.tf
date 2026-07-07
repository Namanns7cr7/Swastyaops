# Buckets per docs/02_TRD.md §6. Uniform access, public-access prevention everywhere.

locals {
  buckets = {
    ingest  = { nearline_days = 30, delete_days = 365, versioning = false }
    reports = { nearline_days = 90, delete_days = 0, versioning = false } # coldline at 365 below
    models  = { nearline_days = 0, delete_days = 0, versioning = true }
  }
}

resource "google_storage_bucket" "buckets" {
  for_each                    = local.buckets
  name                        = "swasthyaops-${var.env}-${each.key}"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = local.labels

  versioning { enabled = each.value.versioning }

  dynamic "lifecycle_rule" {
    for_each = each.value.nearline_days > 0 ? [1] : []
    content {
      action {
        type          = "SetStorageClass"
        storage_class = "NEARLINE"
      }
      condition { age = each.value.nearline_days }
    }
  }

  dynamic "lifecycle_rule" {
    for_each = each.key == "reports" ? [1] : []
    content {
      action {
        type          = "SetStorageClass"
        storage_class = "COLDLINE"
      }
      condition { age = 365 }
    }
  }

  dynamic "lifecycle_rule" {
    for_each = each.value.delete_days > 0 ? [1] : []
    content {
      action { type = "Delete" }
      condition { age = each.value.delete_days }
    }
  }
}

resource "google_storage_bucket_iam_member" "ingestion_reads_ingest" {
  bucket = google_storage_bucket.buckets["ingest"].name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.services["sa-svc-ingestion"].email}"
}

resource "google_storage_bucket_iam_member" "reports_rw" {
  bucket = google_storage_bucket.buckets["reports"].name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.services["sa-svc-reports"].email}"
}
