# Edge: HTTPS LB + Cloud Armor + API Gateway in front of svc-api; DNS + managed certs.
# Topology: docs/02_TRD.md §12. Firebase Hosting serves app.{env}.{domain} separately.
#
# Entire stack is gated on var.enable_edge — it requires ownership of var.domain.
# Dev environments leave it off and call svc-api on its run.app URL directly
# (svc-api ingress falls back to all-traffic in cloudrun.tf when edge is off).

resource "google_compute_security_policy" "edge" {
  count       = var.enable_edge ? 1 : 0
  name        = "swasthyaops-edge"
  description = "OWASP preconfigured rules + per-IP rate limit (docs/02 §12)"

  rule {
    action   = "throttle"
    priority = 100
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 300
        interval_sec = 60
      }
    }
  }

  rule {
    action   = "deny(403)"
    priority = 200
    match {
      expr { expression = "evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable')" }
    }
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    description = "default allow; geo-allowlist IN applied at priority 300 in prod tfvars"
  }
}

resource "google_compute_region_network_endpoint_group" "api" {
  count                 = var.enable_edge ? 1 : 0
  name                  = "neg-svc-api"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run { service = google_cloud_run_v2_service.services["svc-api"].name }
}

resource "google_compute_backend_service" "api" {
  count                 = var.enable_edge ? 1 : 0
  name                  = "be-svc-api"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.edge[0].id
  backend { group = google_compute_region_network_endpoint_group.api[0].id }
  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "api" {
  count           = var.enable_edge ? 1 : 0
  name            = "lb-swasthyaops-api"
  default_service = google_compute_backend_service.api[0].id
}

resource "google_compute_managed_ssl_certificate" "api" {
  count = var.enable_edge ? 1 : 0
  name  = "cert-api-${var.env}"
  managed { domains = ["api.${var.env}.${var.domain}"] }
}

resource "google_compute_target_https_proxy" "api" {
  count            = var.enable_edge ? 1 : 0
  name             = "proxy-api"
  url_map          = google_compute_url_map.api[0].id
  ssl_certificates = [google_compute_managed_ssl_certificate.api[0].id]
}

resource "google_compute_global_address" "api" {
  count = var.enable_edge ? 1 : 0
  name  = "ip-api-${var.env}"
}

resource "google_compute_global_forwarding_rule" "api" {
  count                 = var.enable_edge ? 1 : 0
  name                  = "fr-api"
  target                = google_compute_target_https_proxy.api[0].id
  ip_address            = google_compute_global_address.api[0].id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_dns_managed_zone" "main" {
  count    = var.enable_edge ? 1 : 0
  name     = "swasthyaops-${var.env}"
  dns_name = "${var.env}.${var.domain}."
}

resource "google_dns_record_set" "api" {
  count        = var.enable_edge ? 1 : 0
  managed_zone = google_dns_managed_zone.main[0].name
  name         = "api.${var.env}.${var.domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.api[0].address]
}
