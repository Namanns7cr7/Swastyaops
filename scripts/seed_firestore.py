#!/usr/bin/env python3
"""Seed reference + demo data for a SwasthyaOps environment.

Loads: district Sikar, facilities from the Health Centre Directory extract
(data/sikar_facilities.csv, NIN-keyed), the 381-item EDL medicine catalog
(data/edl_catalog.csv), thresholds, and demo users with custom claims.

--demo-scenario additionally seeds the "Monsoon Week in Sikar" storyline used by the
judge demo (docs/15_Presentation.md §2): 10 days of rising ORS burn at 3 facilities,
a diarrheal footfall spike, monsoon weather rows, and one pending recommendation.

Usage:
  python scripts/seed_firestore.py --project swasthyaops-dev [--demo-scenario]
"""

import argparse
import csv
import random
from datetime import UTC, datetime, timedelta
from pathlib import Path

from google.cloud import firestore

DATA = Path(__file__).parent / "data"
DISTRICT_ID = "sikar-raj"

DEMO_USERS = [
    # (uid, role, district_ids, facility_ids) — claims applied via firebase-admin below
    ("demo-dho", "district_admin", [DISTRICT_ID], []),
    ("demo-dm", "dm", [DISTRICT_ID], []),
    ("demo-incharge-losal", "facility_incharge", [DISTRICT_ID], ["phc-losal"]),
    ("demo-pharmacist-fatehpur", "pharmacist", [DISTRICT_ID], ["chc-fatehpur"]),
    ("demo-viewer", "viewer", [DISTRICT_ID], []),
]

DEMO_SCENARIO_FACILITIES = ["phc-losal", "phc-khandela", "chc-ringas"]


def seed_district(db: firestore.Client) -> None:
    db.collection("districts").document(DISTRICT_ID).set({
        "name": "Sikar", "state": "Rajasthan", "lgd_code": "119",
        "population": 2_677_333,
        "counters": {"facilities": 0, "open_alerts": 0, "pending_recommendations": 0},
        "health_score": 100.0, "created_by": "system:seed",
    })


def seed_facilities(db: firestore.Client) -> int:
    batch, count = db.batch(), 0
    with open(DATA / "sikar_facilities.csv", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            ref = db.collection("facilities").document(row["facility_id"])
            batch.set(ref, {
                "district_id": DISTRICT_ID, "name": row["name"], "type": row["type"],
                "nin": row["nin"], "block": row["block"],
                "location": firestore.GeoPoint(float(row["lat"]), float(row["lon"])),
                "sanctioned": {"doctors": int(row["doctors"]), "nurses": int(row["nurses"]),
                               "pharmacists": int(row["pharmacists"]),
                               "lab_techs": int(row["lab_techs"]), "beds": int(row["beds"])},
                "services": row["services"].split("|"),
                "catchment_population": int(row["catchment"]),
                "status": "active", "health_score": 100.0, "created_by": "system:seed",
            })
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
    batch.commit()
    db.collection("districts").document(DISTRICT_ID).update({"counters.facilities": count})
    return count


def seed_catalog(db: firestore.Client) -> int:
    items = {}
    with open(DATA / "edl_catalog.csv", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            items[row["code"]] = {"name": row["name"], "unit": row["unit"],
                                  "category": row["category"],
                                  "is_essential": row["essential"] == "1"}
    db.collection("config").document("medicine_catalog").set(
        {"version": "raj-edl-2025.2", "items": items})
    db.collection("config").document("thresholds").set({
        "stock_days_critical": 7, "stock_days_risk": 14,
        "footfall_spike_z": 2.5, "bed_saturation_pct": 85,
        "lab_downtime_alert_hours": 48, "stale_facility_hours": 48,
    })
    return len(items)


def seed_demo_scenario(db: firestore.Client) -> None:
    """Monsoon Week storyline (docs/15 §2) — deterministic seed for repeatable demos."""
    rng = random.Random(20260706)
    today = datetime.now(UTC).date()
    for fid in DEMO_SCENARIO_FACILITIES:
        item_ref = (db.collection("facilities").document(fid)
                    .collection("inventory").document("EDL-ORS-200"))
        stock = 220
        for d in range(10, 0, -1):
            day = today - timedelta(days=d)
            burn = int(8 * (1 + (10 - d) * 0.18) + rng.randint(-2, 2))  # rising burn
            stock -= burn
            item_ref.collection("ledger").document(f"seed_{fid}_{day}").set({
                "type": "issue", "qty": -burn, "balance_after": stock,
                "source": "form", "recorded_at": datetime(day.year, day.month, day.day, 12, tzinfo=UTC),
                "district_id": DISTRICT_ID, "created_by": "system:seed",
            })
            db.collection("facilities").document(fid).collection("footfall").document(str(day)).set({
                "total": 70 + (10 - d) * 6, "district_id": DISTRICT_ID,
                "by_symptom": {"fever": 20, "diarrheal": 8 + (10 - d) * 3,
                               "respiratory": 6, "injury": 4, "anc": 10, "other": 22},
                "source": "form", "created_by": "system:seed",
            })
        item_ref.set({"item_code": "EDL-ORS-200", "name": "ORS Sachet 20.5g", "unit": "sachet",
                      "current_stock": stock, "reorder_level": 100,
                      "avg_daily_consumption": 19.0, "district_id": DISTRICT_ID,
                      "predicted_stockout_date": datetime.combine(
                          today + timedelta(days=max(1, stock // 20)), datetime.min.time(), UTC),
                      "created_by": "system:seed"})
    print(f"  demo scenario seeded for {DEMO_SCENARIO_FACILITIES}")


def seed_users(project: str) -> None:
    import firebase_admin
    from firebase_admin import auth, credentials

    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": project})
    for uid, role, districts, facilities in DEMO_USERS:
        try:
            auth.create_user(uid=uid, email=f"{uid}@demo.swasthyaops.in", password="Demo@12345")
        except auth.UidAlreadyExistsError:
            pass
        auth.set_custom_user_claims(uid, {"role": role, "district_ids": districts,
                                          "facility_ids": facilities})
    print(f"  {len(DEMO_USERS)} demo users provisioned")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--demo-scenario", action="store_true")
    args = ap.parse_args()
    if args.project.endswith("-prod"):
        raise SystemExit("refusing to seed a prod project")

    db = firestore.Client(project=args.project)
    seed_district(db)
    print(f"  {seed_facilities(db)} facilities")
    print(f"  {seed_catalog(db)} catalog items")
    seed_users(args.project)
    if args.demo_scenario:
        seed_demo_scenario(db)
    print("done.")


if __name__ == "__main__":
    main()
