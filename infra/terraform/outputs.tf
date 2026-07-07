output "service_urls" {
  value = { for s in local.services : s => google_cloud_run_v2_service.services[s].uri }
}

output "topics" {
  value = [for t in google_pubsub_topic.main : t.name]
}

output "datasets" {
  value = [for d in google_bigquery_dataset.datasets : d.dataset_id]
}

output "buckets" {
  value = { for k, b in google_storage_bucket.buckets : k => b.url }
}

output "deploy_service_account" {
  value = google_service_account.deploy.email
}
