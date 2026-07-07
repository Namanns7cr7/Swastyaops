# Per-service least-privilege identities (docs/02 §7, docs/13 §5). No SA keys anywhere.

resource "google_service_account" "services" {
  for_each     = toset([for s in local.services : "sa-${s}"])
  account_id   = each.key
  display_name = "SwasthyaOps ${each.key}"
}

locals {
  # role → service accounts (project-level; dataset/bucket scoping below and in bigquery.tf/storage.tf)
  project_bindings = {
    "roles/datastore.user"        = ["sa-svc-api", "sa-svc-agents", "sa-svc-forecast"]
    "roles/datastore.viewer"      = ["sa-svc-notify", "sa-svc-reports"]
    "roles/pubsub.publisher"      = ["sa-svc-api", "sa-svc-agents", "sa-svc-forecast", "sa-svc-ingestion", "sa-svc-reports"]
    "roles/aiplatform.user"       = ["sa-svc-api", "sa-svc-agents"]
    "roles/bigquery.jobUser"      = ["sa-svc-agents", "sa-svc-forecast", "sa-svc-reports", "sa-svc-ingestion"]
    "roles/cloudtrace.agent"      = [for s in local.services : "sa-${s}"]
    "roles/logging.logWriter"     = [for s in local.services : "sa-${s}"]
    "roles/monitoring.metricWriter" = [for s in local.services : "sa-${s}"]
  }

  flat_bindings = merge([
    for role, sas in local.project_bindings : {
      for sa in sas : "${role}/${sa}" => { role = role, sa = sa }
    }
  ]...)
}

resource "google_project_iam_member" "service_roles" {
  for_each = local.flat_bindings
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.services[each.value.sa].email}"
}

# Pub/Sub push → Cloud Run: each service's own SA may invoke it (OIDC audience check in-app)
resource "google_cloud_run_v2_service_iam_member" "pubsub_invoker" {
  for_each = toset(local.services)
  name     = google_cloud_run_v2_service.services[each.key].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.services["sa-${each.key}"].email}"
}

# Deploy identity for Cloud Build (docs/02 §7)
resource "google_service_account" "deploy" {
  account_id   = "sa-deploy"
  display_name = "SwasthyaOps CI/CD (Cloud Build)"
}

resource "google_project_iam_member" "deploy_roles" {
  for_each = toset(["roles/run.admin", "roles/artifactregistry.writer", "roles/iam.serviceAccountUser"])
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.deploy.email}"
}
