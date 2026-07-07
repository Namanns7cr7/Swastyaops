resource "google_artifact_registry_repository" "services" {
  repository_id = "services"
  format        = "DOCKER"
  location      = var.region
  description   = "SwasthyaOps service images (built by infra/cloudbuild.yaml, tagged git-{sha})"
  labels        = local.labels

  # Keep last 20 tagged images per service; untagged cleaned after 7 days
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions { keep_count = 20 }
  }
  cleanup_policies {
    id     = "drop-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}
