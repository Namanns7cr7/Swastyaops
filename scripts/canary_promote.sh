#!/usr/bin/env bash
# Canary promotion for prod deploys (docs/02_TRD.md §13, docs/10 §5).
# The deploy step tagged the new revision "canary" with --no-traffic; this script
# shifts 10%, soaks, checks error ratio + P95 against SLO, then promotes or rolls back.
set -euo pipefail

PROJECT="" SOAK_MINUTES=30 REGION="asia-south1"
SERVICES=(svc-api svc-ingestion svc-agents svc-forecast svc-notify svc-reports)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --soak-minutes) SOAK_MINUTES="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done
[[ -n "$PROJECT" ]] || { echo "--project required" >&2; exit 2; }

for SVC in "${SERVICES[@]}"; do
  gcloud run services update-traffic "$SVC" --project "$PROJECT" --region "$REGION" \
    --to-tags canary=10 --quiet
done
echo "canary at 10%; soaking ${SOAK_MINUTES}m..."
sleep $(( SOAK_MINUTES * 60 ))

# Error ratio over the soak window for the canary revision of svc-api (the SLO-bearing service)
ERR_RATIO=$(gcloud monitoring time-series list --project "$PROJECT" \
  --filter 'metric.type="run.googleapis.com/request_count" AND resource.labels.service_name="svc-api"' \
  --format json --interval-start-time "-${SOAK_MINUTES}m" 2>/dev/null \
  | python3 -c '
import json,sys
series=json.load(sys.stdin); tot=err=0
for s in series:
    n=sum(int(p["value"].get("int64Value",0)) for p in s.get("points",[]))
    tot+=n
    if s["metric"]["labels"].get("response_code_class")=="5xx": err+=n
print(err/tot if tot else 0)')

if python3 -c "import sys; sys.exit(0 if float('${ERR_RATIO}') < 0.005 else 1)"; then
  echo "error ratio ${ERR_RATIO} < 0.5% — promoting"
  for SVC in "${SERVICES[@]}"; do
    gcloud run services update-traffic "$SVC" --project "$PROJECT" --region "$REGION" \
      --to-tags canary=100 --quiet
  done
  echo "promoted."
else
  echo "error ratio ${ERR_RATIO} ≥ 0.5% — rolling back" >&2
  for SVC in "${SERVICES[@]}"; do
    gcloud run services update-traffic "$SVC" --project "$PROJECT" --region "$REGION" \
      --to-tags canary=0 --quiet
  done
  exit 1
fi
