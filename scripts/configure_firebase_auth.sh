#!/usr/bin/env bash
# Firebase Auth configuration via Identity Toolkit Admin API (docs/10 §7, docs/13 §3):
# phone OTP provider, email+password, MFA enforcement state, authorized domains.
# Idempotent — safe to re-run after project bootstrap.
set -euo pipefail

PROJECT="${1:?usage: configure_firebase_auth.sh <project-id> <env>}"
ENV="${2:?usage: configure_firebase_auth.sh <project-id> <env>}"
TOKEN=$(gcloud auth print-access-token)
API="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config"

curl -sf -X PATCH "${API}?updateMask=signIn.phoneNumber.enabled,signIn.email.enabled,signIn.email.passwordRequired,mfa.state,authorizedDomains" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "signIn": {
    "phoneNumber": { "enabled": true },
    "email": { "enabled": true, "passwordRequired": true }
  },
  "mfa": { "state": "ENABLED" },
  "authorizedDomains": [
    "localhost",
    "app.${ENV}.swasthyaops.in",
    "${PROJECT}.firebaseapp.com",
    "${PROJECT}.web.app"
  ]
}
JSON

echo "auth configured for ${PROJECT} (MFA enforcement for admin roles is applied at"
echo "sign-in policy level by the provisioning flow — POST /v1/admin/users, docs/13 §3)."
