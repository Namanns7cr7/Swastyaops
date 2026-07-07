# Secret Manager entries. Values are set out-of-band by an operator
# (gcloud secrets versions add — docs/10_Deployment_Guide.md §6); Terraform owns
# existence + access only. Rotation calendar: docs/13_Security.md §7.

locals {
  secrets = {
    sms-gateway-key     = ["sa-svc-notify"]
    sendgrid-key        = ["sa-svc-notify"]
    maps-api-key        = ["sa-svc-agents"] # server-side Routes API key
    fcm-service-account = ["sa-svc-notify"]
  }
  secret_bindings = merge([
    for name, sas in local.secrets : { for sa in sas : "${name}/${sa}" => { secret = name, sa = sa } }
  ]...)
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  secret_id = each.key
  labels    = local.labels
  replication {
    user_managed {
      replicas { location = var.region }
    }
  }
}

resource "google_secret_manager_secret_iam_member" "access" {
  for_each  = local.secret_bindings
  secret_id = google_secret_manager_secret.secrets[each.value.secret].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.services[each.value.sa].email}"
}
