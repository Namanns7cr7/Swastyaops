variable "project_id" {
  type        = string
  description = "GCP project (swasthyaops-{env})"
}

variable "env" {
  type        = string
  description = "Environment: dev | staging | prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env must be dev, staging, or prod."
  }
}

variable "region" {
  type    = string
  default = "asia-south1"
}

variable "dr_region" {
  type    = string
  default = "asia-south2"
}

variable "domain" {
  type        = string
  default     = "swasthyaops.in"
  description = "Base domain; api.{env}. and app.{env}. subdomains are created"
}

variable "alert_notification_channels" {
  type        = list(string)
  default     = []
  description = "Cloud Monitoring notification channel IDs for ops alerts (docs/02 §15)"
}

variable "image_tag" {
  type        = string
  default     = "bootstrap"
  description = "Container tag deployed to Cloud Run; CI passes git-{sha} (docs/10 §4). The literal tag \"bootstrap\" deploys a public hello image so first apply succeeds before any CI build exists."
}

variable "enable_org_policies" {
  type        = bool
  default     = false
  description = "Org-policy guardrails (docs/13 §5) — require a GCP Organization. Enable in staging/prod under the swasthyaops folder; leave false on personal-account dev projects."
}

variable "enable_edge" {
  type        = bool
  default     = false
  description = "External HTTPS LB + Cloud Armor + managed cert + DNS (network.tf) — requires ownership of var.domain. Leave false for dev; hit svc-api via its run.app URL instead."
}

# Per-service scaling per docs/02_TRD.md §2. Defaults are dev-friendly (scale to zero);
# staging/prod tfvars set svc-api min=1 for the 07:00 briefing cold-start SLO (TRD §8).
variable "service_scaling" {
  type = map(object({ min = number, max = number, cpu = string, memory = string, concurrency = number }))
  default = {
    svc-api       = { min = 0, max = 20, cpu = "1", memory = "512Mi", concurrency = 80 }
    svc-ingestion = { min = 0, max = 5, cpu = "1", memory = "1Gi", concurrency = 10 }
    svc-agents    = { min = 0, max = 10, cpu = "2", memory = "2Gi", concurrency = 4 }
    svc-forecast  = { min = 0, max = 3, cpu = "1", memory = "1Gi", concurrency = 1 }
    # Cloud Run requires cpu >= 1 when concurrency > 1
    svc-notify    = { min = 0, max = 10, cpu = "1", memory = "256Mi", concurrency = 40 }
    svc-reports   = { min = 0, max = 5, cpu = "2", memory = "2Gi", concurrency = 2 }
  }
}
