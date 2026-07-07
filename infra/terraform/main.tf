# SwasthyaOps AI — root Terraform module. One workspace per environment (docs/02 §16).
# Bootstrap (state bucket, project, API enablement) per docs/10_Deployment_Guide.md §2.

terraform {
  required_version = ">= 1.8"
  required_providers {
    google      = { source = "hashicorp/google", version = "~> 6.0" }
    google-beta = { source = "hashicorp/google-beta", version = "~> 6.0" }
  }
  backend "gcs" {} # -backend-config="bucket=swasthyaops-{env}-tf-state"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  services = ["svc-api", "svc-ingestion", "svc-agents", "svc-forecast", "svc-notify", "svc-reports"]
  # The topic registry is the single source of truth (architecture/pubsub_topics.yaml).
  topic_registry = yamldecode(file("${path.module}/../../architecture/pubsub_topics.yaml"))
  labels         = { app = "swasthyaops", env = var.env, managed-by = "terraform" }
}

# Data-residency guardrail (NFR-6, docs/13 §5) — gated: needs a GCP Organization
resource "google_project_organization_policy" "resource_locations" {
  count      = var.enable_org_policies ? 1 : 0
  project    = var.project_id
  constraint = "gcp.resourceLocations"
  list_policy {
    allow { values = ["in:asia-south1-locations", "in:asia-south2-locations"] }
  }
}

resource "google_project_organization_policy" "no_sa_keys" {
  count      = var.enable_org_policies ? 1 : 0
  project    = var.project_id
  constraint = "iam.disableServiceAccountKeyCreation"
  boolean_policy { enforced = true }
}
