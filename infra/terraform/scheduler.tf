# Cloud Scheduler jobs (architecture/service_catalog.md, docs/14 §3). Times are IST (Asia/Kolkata).

locals {
  agent_dispatch_jobs = {
    daily-briefing = { schedule = "15 6 * * *", agent = "executive_briefing", task_type = "daily_briefing" }
    disease-sweep  = { schedule = "0 7 * * *", agent = "disease_intelligence", task_type = "daily_sweep" }
    doctor-recon   = { schedule = "30 10 * * *", agent = "doctor", task_type = "daily_reconciliation" }
    lab-review     = { schedule = "0 9 * * *", agent = "laboratory", task_type = "downtime_review" }
    monthly-report = { schedule = "0 3 1 * *", agent = "report", task_type = "monthly_report" }
  }
  forecast_jobs = {
    bqml-train           = { schedule = "0 1 * * 0", path = "/internal/jobs/train" }
    bqml-predict         = { schedule = "0 2 * * *", path = "/internal/jobs/predict" }
    consumption-features = { schedule = "30 1 * * *", path = "/internal/jobs/features" }
  }
  ingestion_jobs = {
    weather-pull = { schedule = "0 4 * * *", path = "/internal/jobs/weather" }
    idsp-pull    = { schedule = "0 5 * * 1", path = "/internal/jobs/idsp" }
  }
}

# Agent tasks go through Pub/Sub like every other trigger (architecture invariant #1)
resource "google_cloud_scheduler_job" "agent_dispatch" {
  for_each  = local.agent_dispatch_jobs
  name      = "dispatch-${each.key}"
  schedule  = each.value.schedule
  time_zone = "Asia/Kolkata"
  region    = var.region

  pubsub_target {
    topic_name = google_pubsub_topic.main["agents.tasks.dispatch"].id
    attributes = { agent = each.value.agent, event_type = "agents.tasks.dispatch" }
    data = base64encode(jsonencode({
      event_type = "agents.tasks.dispatch"
      actor      = "system:scheduler"
      payload    = { agent = each.value.agent, task_type = each.value.task_type }
    }))
  }
}

resource "google_cloud_scheduler_job" "http_jobs" {
  for_each = merge(
    { for k, v in local.forecast_jobs : k => merge(v, { service = "svc-forecast" }) },
    { for k, v in local.ingestion_jobs : k => merge(v, { service = "svc-ingestion" }) },
  )
  name      = each.key
  schedule  = each.value.schedule
  time_zone = "Asia/Kolkata"
  region    = var.region

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.services[each.value.service].uri}${each.value.path}"
    oidc_token {
      service_account_email = google_service_account.services["sa-${each.value.service}"].email
    }
  }

  retry_config { retry_count = 3 }
}
