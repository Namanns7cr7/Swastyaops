# Workload Identity Federation: GitHub Actions → GCP, no service-account keys
# (docs/02_TRD.md §13, docs/13_Security.md §5). The deploy workflow authenticates as
# sa-deploy via OIDC; only the configured repository may impersonate it.
# After apply, set the `wif_provider` output as the WIF_PROVIDER repo variable on GitHub.

variable "github_repo" {
  type        = string
  default     = "Namanns7cr7/Swastyaops"
  description = "GitHub repository (owner/name) allowed to deploy via WIF"
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  # Only tokens minted for our repository are accepted at all
  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "deploy_wif" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

output "wif_provider" {
  description = "Set this as the WIF_PROVIDER repository variable on GitHub"
  value       = google_iam_workload_identity_pool_provider.github.name
}
