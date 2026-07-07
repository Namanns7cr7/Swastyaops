# Six stateless services (docs/02_TRD.md §2). Only svc-api receives external traffic
# (behind API Gateway, network.tf); everything else is internal + Pub/Sub push OIDC.

locals {
  # First apply predates any CI build; the sentinel tag deploys a public hello image
  # (docs/10 §3 "placeholder-ok"). It has no /healthz, so probes target / instead.
  bootstrap   = var.image_tag == "bootstrap"
  image       = local.bootstrap ? "gcr.io/cloudrun/hello" : null
  health_path = local.bootstrap ? "/" : "/healthz"
}

resource "google_cloud_run_v2_service" "services" {
  for_each = toset(local.services)
  name     = each.key
  location = var.region
  labels   = local.labels

  # Without the edge (dev), svc-api is reached directly on its run.app URL.
  ingress = each.key == "svc-api" ? (var.enable_edge ? "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER" : "INGRESS_TRAFFIC_ALL") : "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.services["sa-${each.key}"].email

    scaling {
      min_instance_count = var.service_scaling[each.key].min
      max_instance_count = var.service_scaling[each.key].max
    }
    max_instance_request_concurrency = var.service_scaling[each.key].concurrency

    containers {
      image = coalesce(local.image, "${var.region}-docker.pkg.dev/${var.project_id}/services/${each.key}:${var.image_tag}")

      resources {
        limits = {
          cpu    = var.service_scaling[each.key].cpu
          memory = var.service_scaling[each.key].memory
        }
        cpu_idle = true
      }

      env {
        name  = "SWASTHYAOPS_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "SWASTHYAOPS_ENV"
        value = var.env
      }
      env {
        name  = "SWASTHYAOPS_REGION"
        value = var.region
      }

      startup_probe {
        http_get { path = local.health_path }
        initial_delay_seconds = 5
        failure_threshold     = 5
      }
      liveness_probe {
        http_get { path = local.health_path }
        period_seconds = 30
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image] # CI owns image rollout + canary (docs/10 §5)
  }
}

# svc-notify and svc-reports mount transport secrets (docs/10 §6) — bindings in secrets.tf.
