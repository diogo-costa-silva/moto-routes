#!/usr/bin/env python3
"""
Moto Routes v4 — Database verification script.
Runs all Phase 2 health checks against Supabase.

Usage:
  uv run --with "supabase>=2.10,<3" python scripts/check_db.py
"""

import os, sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

def _load_env() -> None:
    env = PROJECT_ROOT / "frontend" / ".env"
    if not env.exists():
        return
    with open(env) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

_load_env()

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
# Use anon key for SELECT-only queries (public read RLS is enabled)
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE credentials in frontend/.env")
    sys.exit(1)

from supabase import create_client
db = create_client(SUPABASE_URL, SUPABASE_KEY)

SEP = "=" * 60

# ── 1. Row counts ────────────────────────────────────────────────
print(SEP)
print("1. ROW COUNTS")
print(SEP)
tables = [
    "routes", "journeys", "journey_stages",
    "destinations", "pois", "route_pois", "translations",
]
counts = {}
for t in tables:
    resp = db.table(t).select("id", count="exact").execute()
    n = resp.count or 0
    counts[t] = n
    print(f"  {t:<22} {n:>4}")

# ── 2. Routes geometry validity ──────────────────────────────────
print()
print(SEP)
print("2. ROUTES GEOMETRY (slug + landscape_type + distance_km)")
print(SEP)
resp = db.table("routes").select(
    "id, slug, landscape_type, distance_km, geometry_geojson"
).execute()

for r in resp.data:
    geojson = r.get("geometry_geojson")
    has_geom = geojson is not None
    coord_count = 0
    if isinstance(geojson, dict) and "coordinates" in geojson:
        coord_count = len(geojson["coordinates"])
    landscape = r.get("landscape_type") or "MISSING"
    dist = r.get("distance_km") or 0
    print(f"  {r['slug']:<35}  landscape={landscape:<12}  dist={dist:>6}km  coords={coord_count:>4}  geom={'OK' if has_geom else 'MISSING'}")

# ── 3. Translations by language ──────────────────────────────────
print()
print(SEP)
print("3. TRANSLATIONS BY LANGUAGE")
print(SEP)
resp = db.table("translations").select("lang, entity_type").execute()
by_lang: dict = {}
by_type: dict = {}
for row in resp.data:
    lang = row["lang"]
    etype = row["entity_type"]
    by_lang[lang] = by_lang.get(lang, 0) + 1
    key = f"{lang}/{etype}"
    by_type[key] = by_type.get(key, 0) + 1

for lang, n in sorted(by_lang.items()):
    print(f"  lang={lang}  total={n}")
print()
for key, n in sorted(by_type.items()):
    print(f"  {key:<22}  {n}")

# ── 4. Journeys with stage counts ───────────────────────────────
print()
print(SEP)
print("4. JOURNEYS WITH STAGE COUNTS")
print(SEP)
journeys_resp = db.table("journeys").select("id, slug, type, suggested_days").execute()
stages_resp   = db.table("journey_stages").select("journey_id").execute()

stage_counts: dict = {}
for s in stages_resp.data:
    jid = s["journey_id"]
    stage_counts[jid] = stage_counts.get(jid, 0) + 1

for j in journeys_resp.data:
    n = stage_counts.get(j["id"], 0)
    print(f"  {j['slug']:<30}  type={j['type']:<10}  days={j['suggested_days']}  stages={n}")

# ── 5. Destinations with featured route counts ───────────────────
print()
print(SEP)
print("5. DESTINATIONS WITH FEATURED ROUTES")
print(SEP)
dest_resp = db.table("destinations").select("id, slug").execute()
feat_resp = db.table("destination_featured_routes").select("destination_id, route_id, display_order").execute()

feat_map: dict = {}
for f in feat_resp.data:
    did = f["destination_id"]
    feat_map.setdefault(did, []).append(f["display_order"])

for d in dest_resp.data:
    orders = sorted(feat_map.get(d["id"], []))
    print(f"  {d['slug']:<22}  featured_routes={len(orders)}  orders={orders}")

# ── 6. Phase 2 validation summary ───────────────────────────────
print()
print(SEP)
print("6. PHASE 2 VALIDATION SUMMARY")
print(SEP)
checks = [
    ("routes = 7",                    counts["routes"] == 7),
    ("routes with landscape_type",    all(
        r.get("landscape_type") for r in
        db.table("routes").select("landscape_type").execute().data
    )),
    ("journeys >= 1",                 counts["journeys"] >= 1),
    ("journey_stages >= 2",           counts["journey_stages"] >= 2),
    ("destinations >= 2",             counts["destinations"] >= 2),
    ("pois >= 5",                     counts["pois"] >= 5),
    ("route_pois >= 5",               counts["route_pois"] >= 5),
    ("translations >= 14",            counts["translations"] >= 14),
    ("translations PT present",       by_lang.get("pt", 0) > 0),
    ("translations EN present",       by_lang.get("en", 0) > 0),
]

all_ok = True
for label, passed in checks:
    icon = "OK" if passed else "FAIL"
    print(f"  [{icon}] {label}")
    if not passed:
        all_ok = False

print()
print(SEP)
if all_ok:
    print("Phase 2 COMPLETE — ready for Phase 3 (Frontend Routes)")
else:
    print("Phase 2 INCOMPLETE — see failures above")
print(SEP)
