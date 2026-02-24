#!/usr/bin/env python3
"""
Moto Routes v4 — DB verification via Supabase REST API.
Uses only stdlib (urllib + json) — no extra dependencies needed.

Usage:
  python3 scripts/check_db_http.py
"""

import json, os, sys, urllib.request, urllib.parse
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

BASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
KEY      = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY", "")

if not BASE_URL or not KEY:
    print("ERROR: Missing SUPABASE credentials"); sys.exit(1)

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "count=exact",
}


def get(path: str, params: dict | None = None) -> tuple[list, int]:
    url = f"{BASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        # Content-Range header: "0-N/TOTAL"
        cr = resp.headers.get("Content-Range", "")
        total = int(cr.split("/")[-1]) if "/" in cr else len(data)
    return data, total


SEP = "=" * 60

# ── 1. Row counts ────────────────────────────────────────────────
print(SEP)
print("1. ROW COUNTS")
print(SEP)
tables = ["routes", "journeys", "journey_stages", "destinations",
          "pois", "route_pois", "translations"]
counts: dict[str, int] = {}
for t in tables:
    _, n = get(t, {"select": "id"})
    counts[t] = n
    print(f"  {t:<22} {n:>4}")

# ── 2. Routes geometry + metadata ───────────────────────────────
print()
print(SEP)
print("2. ROUTES — geometry_geojson + landscape_type + distance_km")
print(SEP)
routes_data, _ = get("routes", {"select": "id,slug,landscape_type,distance_km,geometry_geojson"})

geom_issues = []
for r in routes_data:
    geojson = r.get("geometry_geojson")
    has_geom = geojson is not None
    coord_count = 0
    if isinstance(geojson, dict) and "coordinates" in geojson:
        coord_count = len(geojson["coordinates"])
    landscape = r.get("landscape_type") or "!! MISSING"
    dist = r.get("distance_km") or 0
    geom_ok = has_geom and coord_count > 0
    if not geom_ok or not r.get("landscape_type"):
        geom_issues.append(r["slug"])
    print(f"  {r['slug']:<37} landscape={landscape:<14} dist={dist:>6}km  coords={coord_count:>4}  geom={'OK' if geom_ok else 'MISSING'}")

# ── 3. Translations by language ──────────────────────────────────
print()
print(SEP)
print("3. TRANSLATIONS BY LANGUAGE + ENTITY TYPE")
print(SEP)
tr_data, tr_total = get("translations", {"select": "lang,entity_type"})
by_lang: dict[str, int] = {}
by_combo: dict[str, int] = {}
for row in tr_data:
    lang  = row["lang"]
    etype = row["entity_type"]
    by_lang[lang]  = by_lang.get(lang, 0) + 1
    key = f"{lang}/{etype}"
    by_combo[key]  = by_combo.get(key, 0) + 1

print(f"  Total translations: {tr_total}")
print()
for lang, n in sorted(by_lang.items()):
    print(f"  lang={lang}   count={n}")
print()
for key, n in sorted(by_combo.items()):
    print(f"  {key:<28}  {n}")

# ── 4. Journeys with stage counts ───────────────────────────────
print()
print(SEP)
print("4. JOURNEYS WITH STAGE COUNTS")
print(SEP)
journeys_data, _ = get("journeys", {"select": "id,slug,type,suggested_days"})
stages_data,   _ = get("journey_stages", {"select": "journey_id"})

stage_counts: dict[str, int] = {}
for s in stages_data:
    jid = s["journey_id"]
    stage_counts[jid] = stage_counts.get(jid, 0) + 1

for j in journeys_data:
    n = stage_counts.get(j["id"], 0)
    print(f"  {j['slug']:<32}  type={j['type']:<10}  days={j['suggested_days']}  stages={n}")

# ── 5. Destinations with featured route counts ───────────────────
print()
print(SEP)
print("5. DESTINATIONS WITH FEATURED ROUTES")
print(SEP)
dest_data, _ = get("destinations", {"select": "id,slug"})
feat_data, _ = get("destination_featured_routes", {"select": "destination_id,display_order"})

feat_map: dict[str, list] = {}
for f in feat_data:
    did = f["destination_id"]
    feat_map.setdefault(did, []).append(f["display_order"])

for d in dest_data:
    orders = sorted(feat_map.get(d["id"], []))
    print(f"  {d['slug']:<24}  featured_routes={len(orders)}  display_orders={orders}")

# ── 6. Phase 2 validation summary ───────────────────────────────
print()
print(SEP)
print("6. PHASE 2 VALIDATION SUMMARY")
print(SEP)

all_have_landscape = all(r.get("landscape_type") for r in routes_data)

checks = [
    ("routes = 7",                   counts["routes"] == 7),
    ("routes with landscape_type",   all_have_landscape),
    ("routes geometry all present",  len(geom_issues) == 0),
    ("journeys >= 1",                counts["journeys"] >= 1),
    ("journey_stages >= 2",          counts["journey_stages"] >= 2),
    ("destinations >= 2",            counts["destinations"] >= 2),
    ("pois >= 5",                    counts["pois"] >= 5),
    ("route_pois >= 5",              counts["route_pois"] >= 5),
    ("translations >= 14",           counts["translations"] >= 14),
    ("translations lang=pt present", by_lang.get("pt", 0) > 0),
    ("translations lang=en present", by_lang.get("en", 0) > 0),
]

all_ok = True
for label, passed in checks:
    icon = "OK  " if passed else "FAIL"
    print(f"  [{icon}] {label}")
    if not passed:
        all_ok = False

if geom_issues:
    print(f"\n  Routes with geometry issues: {geom_issues}")

print()
print(SEP)
if all_ok:
    print("  Phase 2 COMPLETE — pronto para Fase 3 (Frontend Routes)")
else:
    print("  Phase 2 INCOMPLETE — ver falhas acima")
print(SEP)
