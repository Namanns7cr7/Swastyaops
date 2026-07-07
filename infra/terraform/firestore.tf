# Firestore database, composite indexes, TTL policies (docs/04 §1.6–1.7).
# Security rules deploy via Firebase CLI from infra/firestore.rules (docs/10 §7).

resource "google_firestore_database" "main" {
  name                              = "(default)"
  location_id                       = var.region
  type                              = "FIRESTORE_NATIVE"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED" # RPO 1h, NFR-10
  delete_protection_state           = var.env == "prod" ? "DELETE_PROTECTION_ENABLED" : "DELETE_PROTECTION_DISABLED"
}

locals {
  composite_indexes = {
    alerts_inbox    = { collection = "alerts", fields = [["district_id", "ASC"], ["status", "ASC"], ["severity", "ASC"], ["created_at", "DESC"]] }
    alerts_by_type  = { collection = "alerts", fields = [["district_id", "ASC"], ["type", "ASC"], ["created_at", "DESC"]] }
    recs_queue      = { collection = "recommendations", fields = [["district_id", "ASC"], ["status", "ASC"], ["created_at", "DESC"]] }
    facilities_rank = { collection = "facilities", fields = [["district_id", "ASC"], ["type", "ASC"], ["health_score", "ASC"]] }
    notif_feed      = { collection = "notifications", fields = [["user_id", "ASC"], ["status", "ASC"], ["created_at", "DESC"]] }
    agent_ops       = { collection = "agent_runs", fields = [["agent", "ASC"], ["outcome", "ASC"], ["created_at", "DESC"]] }
  }
  group_indexes = {
    donor_search = { collection = "inventory", fields = [["item_code", "ASC"], ["current_stock", "ASC"]] }
    stock_risk   = { collection = "inventory", fields = [["district_id", "ASC"], ["predicted_stockout_date", "ASC"]] }
  }
}

resource "google_firestore_index" "composite" {
  for_each   = local.composite_indexes
  database   = google_firestore_database.main.name
  collection = each.value.collection
  dynamic "fields" {
    for_each = each.value.fields
    content {
      field_path = fields.value[0]
      order      = fields.value[1] == "ASC" ? "ASCENDING" : "DESCENDING"
    }
  }
}

resource "google_firestore_index" "collection_group" {
  for_each    = local.group_indexes
  database    = google_firestore_database.main.name
  collection  = each.value.collection
  query_scope = "COLLECTION_GROUP"
  dynamic "fields" {
    for_each = each.value.fields
    content {
      field_path = fields.value[0]
      order      = fields.value[1] == "ASC" ? "ASCENDING" : "DESCENDING"
    }
  }
}

# TTL on expires_at (docs/04 §1.7)
resource "google_firestore_field" "ttl" {
  for_each   = toset(["alerts", "recommendations", "agent_runs", "notifications", "briefings", "forecasts", "idempotency_keys", "processed_events"])
  database   = google_firestore_database.main.name
  collection = each.key
  field      = "expires_at"
  ttl_config {}
}
