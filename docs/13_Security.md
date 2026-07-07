# 13 — Security & Compliance

**Status:** Approved · **Owner:** Security (tech lead acting) · **Last updated:** 2026-07-06
**Related:** [TRD](02_TRD.md) §7, §12, §14 · [Database Schema](04_Database_Schema.md) §1.8 (rules) · [API Spec](05_API_Specification.md) §2–3 · IaC: [infra/terraform/iam.tf](../infra/terraform/iam.tf)

---

## 1. Principles

1. **No patient PII at pilot.** The platform operates on aggregate operational data (counts, stock, statuses). This is a product decision ([PRD](01_PRD.md) §10) that removes the highest-risk data class entirely.
2. **Humans approve interventions.** Agents draft; officers with authority sign ([AI Architecture](06_AI_Architecture.md) §4).
3. **Least privilege everywhere:** per-service SAs, per-dataset IAM, claim-scoped users, no SA keys anywhere.
4. **Everything attributable:** immutable audit trail for human and agent actions (NFR-11).

## 2. Data classification & DPDP Act 2023

| Class | Examples | Handling |
|---|---|---|
| Public | NFHS/RHS/HMIS published aggregates, facility directory | No restriction |
| Operational | Stock levels, footfall counts, bed occupancy, alerts | District-scoped access; India-resident storage (NFR-6) |
| Personal (staff) | Staff names, phones, attendance records | DPDP personal data: purpose-limited (duty visibility), consent via employment notice at onboarding, access limited to own facility + district admin; erasure on exit via `staff.active=false` + 90-d purge job |
| Personal (users) | Account phone/email, preferences | DPDP: consent at registration, self-service export/delete in S16 |
| **Not collected** | Patient identity, diagnoses linked to persons, ABHA IDs | Enforced by schema — no fields exist; footfall is counts by symptom category only |

DPDP obligations mapped: notice & consent (onboarding flows), purpose limitation (this doc + PRD), data minimization (schema review gate), breach notification (§10 incident process, Data Protection Board within statutory window), Significant Data Fiduciary readiness deferred to state scale ([Roadmap](16_Future_Roadmap.md)). Attendance data is employment-context data of government staff, processed for the state's statutory health administration function; the framing and access limits above are reviewed with the district legal cell before go-live.

## 3. Authentication

- **Firebase Authentication.** Facility roles: phone OTP (device remembered 30 d, re-auth on new device). Admin roles (`district_admin`, `dm`, `state_admin`): email + password + **enforced TOTP MFA**; step-up WebAuthn/biometric confirm on approval actions ([App Flow](08_App_Flow.md) §5).
- ID tokens (1 h) with custom claims `role`, `district_ids[]`, `facility_ids[]` — set only by the provisioning flow (`POST /v1/admin/users`), which writes both claims and the `users` mirror doc atomically and audit-logs the grant.
- Session policy: refresh tokens revoked on deactivation (`:deactivate` calls Admin SDK revoke); no auto-logout under 8 h ([UI/UX](09_UI_UX_Guidelines.md) §7 timing).

## 4. Authorization matrix (enforced in `svc-api` + Firestore rules)

| Capability | state_admin | district_admin | dm | facility_incharge | pharmacist | lab_tech | viewer |
|---|---|---|---|---|---|---|---|
| Read district dashboards/alerts | ✔ (all districts) | ✔ | ✔ | own facility only | own facility | own facility | ✔ |
| Approve/reject recommendations | ✖ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ |
| Write stock/footfall/attendance/beds/labs | ✖ | ✖ | ✖ | ✔ (own) | stock+footfall (own) | labs (own) | ✖ |
| NL query | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ |
| Briefings/reports | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✔ |
| User admin | ✔ | ✔ (own district) | ✖ | ✖ | ✖ | ✖ | ✖ |
| Audit logs, agent runs | ✔ | ✔ (own district) | ✖ | ✖ | ✖ | ✖ | ✖ |

Tenancy: `district_id` scoping applied to **every** query server-side from claims, mirrored in Firestore rules ([Database Schema](04_Database_Schema.md) §1.8); cross-tenant mismatch → `403`, tested by E2E journey 8 ([Testing](12_Testing_Strategy.md) §3).

## 5. Service identity (IAM)

Per-service SAs and roles as tabulated in [TRD](02_TRD.md) §7; additional constraints:
- No SA keys — Cloud Run ambient identity; GitHub → GCP via Workload Identity Federation.
- Pub/Sub push subscriptions authenticate with OIDC tokens; each receiving service validates audience + expected subscription SA.
- Org policies (Terraform): `constraints/iam.disableServiceAccountKeyCreation`, `constraints/gcp.resourceLocations` = `in:asia-south1-locations` + `asia-south2`, `constraints/storage.publicAccessPrevention`.
- Agent tools run under `sa-svc-agents` — agents physically cannot exceed tool scope ([Agent Design](07_Agent_Design.md) common contract).

## 6. Data protection

Encryption at rest (Google-managed) + TLS 1.2+ everywhere; CMEK deliberately deferred (no patient PII; revisit at state scale). Data residency pinned by org policy (§5). Backups per [Deployment](10_Deployment_Guide.md) §9. Log redaction: phone numbers masked in application logs (structured logger filter, tested).

## 7. Secrets & supply chain

Secret Manager only ([Deployment](10_Deployment_Guide.md) §6), quarterly rotation calendar; distroless base images; Artifact Analysis scanning with deploy block on critical CVEs; dependencies pinned (uv lock / package-lock) with weekly Renovate PRs; Cloud Build provenance (SLSA L2) verified at deploy.

## 8. AI-specific security

- **Prompt injection:** all facility-entered free text wrapped in `<untrusted_data>` delimiters with instruction-hierarchy preamble; injection eval suite (50 adversarial cases) must pass 100% in CI ([AI Architecture](06_AI_Architecture.md) §3, §8).
- **Output safety:** structured-output schemas prevent free-form action strings; `create_recommendation` tool validates actions against policy (transfer ≤ donor surplus, no negative qty) — invalid actions are unrepresentable ([Agent Design](07_Agent_Design.md) §8).
- **Exfiltration:** agents have no network tools; BigQuery tool templates are parameterized (no raw SQL); tool results size-capped.
- **Memory poisoning:** Memory Bank writes are explicit tool calls, district-scoped, listed in admin UI (S15) and deletable; memory content passes the same untrusted-data wrapping when re-injected.

## 9. Assurance activities

| Activity | When |
|---|---|
| Threat model review (STRIDE over [Architecture](03_System_Architecture.md) §2 diagram) | Sprint 2, revisited Sprint 11 |
| External penetration test (API + web + PWA) | Sprint 11, then annual |
| Firestore rules matrix tests | Every PR |
| Access review (users, IAM bindings vs Terraform) | Quarterly |
| DR + degradation drills | Quarterly ([Deployment](10_Deployment_Guide.md) §9) |
| Dependency & container CVE scan | Continuous, deploy-blocking |

## 10. Incident response

Sev1 = data breach / auth bypass / wrong-district data exposure. Process: on-call acknowledges (PagerDuty via Cloud Monitoring) → contain (revoke tokens / disable service traffic / rotate secrets — scripted in runbooks) → assess scope from audit logs + Cloud Logging → notify: district administration same day, Data Protection Board + affected principals per DPDP timelines if personal data involved → post-mortem within 5 working days, actions tracked to closure. Contact tree and runbooks live in the ops journal; drill in Sprint 11.

## 11. Threat model summary (top risks & mitigations)

| Threat | Vector | Mitigation |
|---|---|---|
| Cross-district data exposure | IDOR on district-scoped endpoints | Claim-derived scoping (never request-supplied), rules mirror, E2E probe 8 |
| Stolen facility phone | OTP session on lost device | 30-d device binding, remote revoke on report, facility scope limits blast radius |
| Malicious insider edits stock to hide leakage | Legit credentials | Append-only ledger, anomaly detection (Inventory Agent), immutable audit |
| Forged Pub/Sub push | Direct POST to internal endpoints | Internal ingress + OIDC audience validation |
| Prompt injection via voice/notes | Facility free text → agent context | §8 wrapping + eval gate + no-network tools |
| SMS spoofing to staff | Fake "transfer order" SMS | Orders verifiable in-app (order # lookup); SMS always says "verify in app" |
| Terraform state compromise | State bucket access | Versioned locked bucket, admin-group-only, no secrets in state |
