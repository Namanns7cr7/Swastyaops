-- Hourly ELT: swasthyaops_raw.events → swasthyaops_curated.inventory_transactions.
-- Idempotent MERGE on event_id (docs/04_Database_Schema.md §3.2); deployed as a
-- BigQuery scheduled query by infra/terraform/bigquery.tf. The same pattern is
-- replicated per event type (footfall_daily, attendance_daily, bed_snapshots, ...).

MERGE `swasthyaops_curated.inventory_transactions` T
USING (
  SELECT
    JSON_VALUE(data, '$.event_id')                                   AS event_id,
    TIMESTAMP(JSON_VALUE(data, '$.occurred_at'))                     AS occurred_at,
    JSON_VALUE(data, '$.district_id')                                AS district_id,
    JSON_VALUE(data, '$.facility_id')                                AS facility_id,
    JSON_VALUE(data, '$.payload.item_code')                          AS item_code,
    JSON_VALUE(data, '$.payload.item_name')                          AS item_name,
    JSON_VALUE(data, '$.payload.txn_type')                           AS txn_type,
    CAST(JSON_VALUE(data, '$.payload.qty') AS INT64)                 AS qty,
    CAST(JSON_VALUE(data, '$.payload.balance_after') AS INT64)       AS balance_after,
    JSON_VALUE(data, '$.payload.batch_no')                           AS batch_no,
    JSON_VALUE(data, '$.payload.source')                             AS source,
    JSON_VALUE(data, '$.actor')                                      AS actor
  FROM `swasthyaops_raw.events`
  WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 3 HOUR)  -- overlap window; MERGE dedups
    AND JSON_VALUE(data, '$.event_type') = 'facility.inventory.updated'
    AND JSON_VALUE(data, '$.district_id') != 'smoke-test'
  QUALIFY ROW_NUMBER() OVER (PARTITION BY JSON_VALUE(data, '$.event_id') ORDER BY publish_time DESC) = 1
) S
ON T.event_id = S.event_id
   AND T.occurred_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 4 HOUR)   -- partition pruning
WHEN NOT MATCHED THEN
  INSERT (event_id, occurred_at, district_id, facility_id, item_code, item_name,
          txn_type, qty, balance_after, batch_no, source, actor)
  VALUES (S.event_id, S.occurred_at, S.district_id, S.facility_id, S.item_code, S.item_name,
          S.txn_type, S.qty, S.balance_after, S.batch_no, S.source, S.actor);
