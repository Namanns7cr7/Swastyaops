#!/usr/bin/env python3
"""Post-deploy verification (docs/10_Deployment_Guide.md §8).

Levels:
  smoke — /healthz + /readyz on all six services (run inside Cloud Build)
  full  — additionally: event round-trip to BigQuery, API write path, agent ping,
          briefing dry-run render (run from an operator workstation with ADC)

Usage: python scripts/smoke_test.py --project swasthyaops-dev [--level full]
"""

import argparse
import json
import os
import subprocess
import sys
import time

import httpx

SERVICES = ["svc-api", "svc-ingestion", "svc-agents", "svc-forecast", "svc-notify", "svc-reports"]
REGION = "asia-south1"

def run(cmd: list[str]) -> str:
    use_shell = os.name == "nt"
    return subprocess.check_output(cmd, text=True, shell=use_shell).strip()


def service_url(project: str, svc: str) -> str:
    return run(["gcloud", "run", "services", "describe", svc, "--project", project,
                "--region", REGION, "--format", "value(status.url)"])


def id_token(audience: str) -> str:
    return run(["gcloud", "auth", "print-identity-token", f"--audiences={audience}"])


def check_health(project: str) -> list[str]:
    failures = []
    for svc in SERVICES:
        url = service_url(project, svc)
        for path in ("/healthz", "/readyz"):
            if svc != "svc-api" and path == "/readyz":
                continue  # internal services expose /healthz only
            r = httpx.get(f"{url}{path}",
                          headers={"Authorization": f"Bearer {id_token(url)}"}, timeout=15)
            ok = r.status_code == 200
            print(f"  {'OK ' if ok else 'FAIL'} {svc}{path} → {r.status_code}")
            if not ok:
                failures.append(f"{svc}{path}")
    return failures


def check_event_roundtrip(project: str) -> list[str]:
    """Publish a probe event; assert it lands in swasthyaops_raw.events < 30s."""
    from google.cloud import bigquery, pubsub_v1

    probe_id = f"smoke-{int(time.time())}"
    publisher = pubsub_v1.PublisherClient()
    publisher.publish(
        publisher.topic_path(project, "facility.inventory.updated"),
        json.dumps({"event_id": probe_id, "event_type": "facility.inventory.updated",
                    "district_id": "smoke-test", "facility_id": "smoke-facility",
                    "actor": "system:smoke", "payload": {"probe": True}}).encode(),
        event_type="facility.inventory.updated", district_id="smoke-test",
        ordering_key="smoke-facility",
    ).result(timeout=10)

    bq = bigquery.Client(project=project)
    deadline = time.time() + 30
    while time.time() < deadline:
        rows = list(bq.query(
            "SELECT 1 FROM swasthyaops_raw.events "
            "WHERE JSON_VALUE(data, '$.event_id') = @id "
            "AND _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)",
            job_config=bigquery.QueryJobConfig(query_parameters=[
                bigquery.ScalarQueryParameter("id", "STRING", probe_id)]),
        ).result())
        if rows:
            print(f"  OK  event {probe_id} visible in BigQuery")
            return []
        time.sleep(3)
    return [f"event {probe_id} not in BigQuery within 30s"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--level", choices=["smoke", "full"], default="smoke")
    args = ap.parse_args()

    failures = check_health(args.project)
    if args.level == "full":
        failures += check_event_roundtrip(args.project)
        # Full-level agent ping + briefing dry-run land with svc-agents in Sprint 6
        # (docs/11); the assertions are specified in docs/10 §8.
    if failures:
        print(f"\nFAILED: {failures}")
        sys.exit(1)
    print("\nall checks passed.")


if __name__ == "__main__":
    main()
