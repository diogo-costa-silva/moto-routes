#!/usr/bin/env python3
"""
Moto Routes v4 — Phase 2: GPX Data Import Pipeline

Populates Supabase with 8 routes, 2 journeys, 3 destinations, 5 POIs,
and 42+ translations from GPX files. Idempotent — safe to run multiple times.

Usage:
  1. Add SUPABASE_SERVICE_KEY to frontend/.env
     (Supabase Dashboard > Settings > API > Legacy > service_role key)
  2. uv run --directory scripts python import_gpx.py
"""

import os, sys, math
from pathlib import Path
import gpxpy
from geopy.distance import geodesic
from supabase import create_client, Client

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MAX_TRACK_POINTS = 2000  # Downsample above this to stay under REST payload limit


# --- Environment ---------------------------------------------------------

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
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_KEY in frontend/.env")
    print("  Get service_role key: Supabase Dashboard > Settings > API")
    sys.exit(1)


# --- Data definitions ----------------------------------------------------

# (code, slug, name, gpx, landscape, difficulty, parent_code, relationship, trim_south_lat, trim_west_lon)
_RD = [
    ("pt-n222",               "pt-n222",               "N222 — Vale do Douro",         "pt/pt-n222.gpx",               "river_valley", "intermediate", None,      None,              None,  None),
    ("pt-n222-ext-mesao-frio","pt-n222-ext-mesao-frio","N222 — Extensão Mesão Frio",   "pt/pt-n222-ext-mesao-frio.gpx","river_valley", "intermediate","pt-n222", "is_extension_of", None,  None),
    ("pt-n222-ext-pias",      "pt-n222-ext-pias",      "N222 — Extensão Pias",         "pt/pt-n222-ext-pias.gpx",      "river_valley", "intermediate","pt-n222", "is_extension_of", None,  None),
    ("pt-n222-var-margem-norte","pt-n222-var-margem-norte","N222 — Variante Margem Norte","pt/pt-n222-var-margem-norte.gpx","river_valley","intermediate","pt-n222","is_variant_of",  None,  None),
    ("pt-n304-alvao",         "pt-n304-alvao",         "N304 — Serra do Alvão",        "pt/pt-n304-alvao.gpx",         "mountain",     "advanced",    None,      None,              None,  None),
    ("pt-n2",                 "pt-n2",                 "N2 — A Estrada Nacional",      "pt/pt-n2.gpx",                 "mixed",        "beginner",    None,      None,              None,  None),
    ("es-figueres-cadaques",  "es-figueres-cadaques",  "Figueres — Cadaqués",          "es/es-figueres-cadaques.gpx",  "coast",        "intermediate",None,      None,              None,  None),
    ("n2-tras-os-montes",     "n2-tras-os-montes",     "N2 — Trás-os-Montes",          "pt/pt-n2.gpx",                 "mountain",     "intermediate","pt-n2",   "is_variant_of",   41.15, None),
    ("pt-n103",               "pt-n103",               "N103 — De Esposende a Chaves", "pt/pt-n103.gpx",               "mountain",     "intermediate", None,      None,              None,  None),
]
ROUTES = [
    {"code": c, "slug": s, "name": n, "gpx": g, "landscape_type": l,
     "difficulty": d, "parent_code": p, "relationship": r, "trim_south_lat": t, "trim_west_lon": w}
    for c, s, n, g, l, d, p, r, t, w in _RD
]

JOURNEYS = [
    {"name": "Rota do Douro", "slug": "rota-do-douro", "type": "linear", "suggested_days": 2,
     "description": "Uma viagem épica pelo Vale do Douro, percorrendo a lendária N222 e as suas extensões.",
     "stages": [("pt-n222", 1, "N222 Principal"), ("pt-n222-ext-mesao-frio", 2, "Extensão Mesão Frio"), ("pt-n222-ext-pias", 3, "Extensão Pias")]},
    {"name": "Volta Trás-os-Montes", "slug": "volta-tras-os-montes", "type": "circular", "suggested_days": 3,
     "description": "Circuito pelas montanhas transmontanas, pela Serra do Alvão e pela histórica N2.",
     "stages": [("pt-n304-alvao", 1, "Serra do Alvão"), ("n2-tras-os-montes", 2, "N2 — Trás-os-Montes")]},
]

DESTINATIONS = [
    {"name": "Vale do Douro", "slug": "vale-do-douro",
     "description": "O coração vinhateiro de Portugal, com paisagens de socalcos ao longo do Rio Douro.",
     "bbox": (-8.0, -7.5, 41.1, 41.3),
     "featured": ["pt-n222", "pt-n222-ext-mesao-frio", "pt-n222-var-margem-norte"]},
    {"name": "Serra do Alvão", "slug": "serra-do-alvao",
     "description": "Parque Natural com paisagens graníticas únicas e cascatas impressionantes.",
     "bbox": (-7.8, -7.5, 41.4, 41.6),
     "featured": ["pt-n304-alvao"]},
    {"name": "Trás-os-Montes", "slug": "tras-os-montes",
     "description": "Terra de contrastes, de vinhos e de tradições milenares do nordeste português.",
     "bbox": (-7.5, -6.8, 41.4, 41.9),
     "featured": ["n2-tras-os-montes", "pt-n304-alvao", "pt-n103"]},
]

# (name, type, lon, lat, description, association_type, distance_m, route_code, km_marker)
POIS = [
    ("Miradouro de S. Leonardo de Galafura", "viewpoint",       -7.7333, 41.1389, "Um dos mais belos miradouros do Douro, com vista panorâmica sobre os vinhedos.",               "on_route",  0,    "pt-n222",      12.5),
    ("Quinta do Bomfim",                     "historical_site", -7.7500, 41.1600, "Quinta histórica da família Symington, produtora de Dow's e Graham's Porto.",                   "near_route",200,  "pt-n222",       8.0),
    ("Restaurante DOC",                      "restaurant",      -7.5533, 41.1167, "Restaurante do Chef Rui Paula, com estrela Michelin e vista privilegiada sobre o Douro.",       "detour",    800,  "pt-n222",      35.0),
    ("Fisgas de Ermelo",                     "viewpoint",       -7.7167, 41.5000, "Imponente cascata no coração do Parque Natural do Alvão, com queda de 400m.",                  "detour",   2000,  "pt-n304-alvao",18.0),
    ("Posto BP Vila Real",                   "fuel_station",    -7.7400, 41.3010, "Posto de combustível em Vila Real, ideal para reabastecer antes da Serra do Alvão.",            "on_route",  0,    "pt-n304-alvao", 2.0),
    ("Melhor Troço — Começa Aqui",           "highlight_start", -8.416860, 41.548272, "A partir de Esposende, os melhores 130 km da N103 pelo Parque Nacional Peneda-Gerês.",        "on_route",  0,    "pt-n103",      52.0),
]

# Translations: key → {lang: {field: value}}
ROUTE_TR: dict = {
    "pt-n222":                {"pt": {"name": "N222 — Vale do Douro",           "description": "A estrada mais bonita do mundo, segundo o The Guardian. Serpenteia pelo Rio Douro, entre vinhedos e quintas de vinho do Porto."},
                               "en": {"name": "N222 — Douro Valley",            "description": "Named the world's most beautiful road by The Guardian. Snakes along the Douro River through terraced vineyards and Port wine estates."}},
    "pt-n222-ext-mesao-frio": {"pt": {"name": "N222 — Extensão Mesão Frio",     "description": "Extensão norte da N222, pela histórica vila de Mesão Frio e seus terraços vinhateiros."},
                               "en": {"name": "N222 — Mesão Frio Extension",    "description": "Northern extension of the N222, through the historic town of Mesão Frio and its wine terraces."}},
    "pt-n222-ext-pias":       {"pt": {"name": "N222 — Extensão Pias",           "description": "Extensão sul da N222 pela margem ribeirinha entre Pinhão e a aldeia de Pias."},
                               "en": {"name": "N222 — Pias Extension",          "description": "Southern extension of the N222 along the riverside between Pinhão and the village of Pias."}},
    "pt-n222-var-margem-norte":{"pt":{"name": "N222 — Variante Margem Norte",   "description": "Variante pela margem norte do Douro, com perspectivas únicas sobre o vale e os seus vinhedos."},
                               "en": {"name": "N222 — North Bank Variant",      "description": "Alternative variant along the north bank of the Douro, offering unique perspectives on the valley."}},
    "pt-n304-alvao":          {"pt": {"name": "N304 — Serra do Alvão",          "description": "Rota de montanha no Parque Natural do Alvão, com curvas técnicas e vistas sobre o planalto transmontano."},
                               "en": {"name": "N304 — Alvão Mountain Range",   "description": "Mountain route through the Alvão Natural Park, with technical curves and views over the transmontane plateau."}},
    "pt-n2":                  {"pt": {"name": "N2 — A Estrada Nacional",        "description": "A mais longa estrada nacional de Portugal, ligando Chaves a Faro. Uma viagem pelo interior do país."},
                               "en": {"name": "N2 — The National Road",         "description": "Portugal's longest national road, connecting Chaves to Faro through the country's interior."}},
    "n2-tras-os-montes":      {"pt": {"name": "N2 — Trás-os-Montes",            "description": "O troço norte da histórica N2, de Chaves ao Vale do Douro, pelo coração das montanhas transmontanas."},
                               "en": {"name": "N2 — Trás-os-Montes",            "description": "The northern stretch of the historic N2, from Chaves to the Douro Valley, through the heart of the Transmontane mountains."}},
    "es-figueres-cadaques":   {"pt": {"name": "Figueres — Cadaqués",            "description": "Rota costeira pela Costa Brava catalã, passando pelo Cabo de Creus. Paisagens mediterrâneas e curvas sobre o mar."},
                               "en": {"name": "Figueres — Cadaqués",            "description": "Coastal route along the Catalan Costa Brava, passing through Cape Creus. Mediterranean landscapes above the sea."}},
    "pt-n103":                {"pt": {"name": "N103 — De Esposende a Chaves",   "description": "O eixo rodoviário do norte transmontano, de Esposende a Chaves. Paisagens de montanha e planaltos entre o litoral minhoto e Trás-os-Montes."},
                               "en": {"name": "N103 — Esposende to Chaves",     "description": "The northern transmontane road axis, from Esposende to Chaves. Mountain landscapes and plateaus between the Minho coast and Trás-os-Montes."}},
}
JOURNEY_TR: dict = {
    "rota-do-douro":         {"pt": {"name": "Rota do Douro",          "description": "Uma viagem épica pelo Vale do Douro, percorrendo a lendária N222 e as suas extensões."},
                              "en": {"name": "Douro Route",             "description": "An epic journey through the Douro Valley, along the legendary N222 and its extensions."}},
    "volta-tras-os-montes":  {"pt": {"name": "Volta Trás-os-Montes",   "description": "Circuito pelas montanhas transmontanas, pela Serra do Alvão e pela histórica N2."},
                              "en": {"name": "Trás-os-Montes Tour",     "description": "A circuit through the transmontane mountains, through the Alvão range and the historic N2."}},
}
DEST_TR: dict = {
    "vale-do-douro":  {"pt": {"name": "Vale do Douro",    "description": "O coração vinhateiro de Portugal, com paisagens de socalcos ao longo do Rio Douro."},
                       "en": {"name": "Douro Valley",      "description": "The wine-growing heart of Portugal, with terraced landscapes along the Douro River."}},
    "serra-do-alvao": {"pt": {"name": "Serra do Alvão",   "description": "Parque Natural com paisagens graníticas únicas e cascatas impressionantes."},
                       "en": {"name": "Alvão Range",       "description": "Natural Park with unique granite landscapes and impressive waterfalls."}},
    "tras-os-montes": {"pt": {"name": "Trás-os-Montes",   "description": "Terra de contrastes, de vinhos e de tradições milenares do nordeste português."},
                       "en": {"name": "Trás-os-Montes",   "description": "Land of contrasts, wines and age-old traditions in northeastern Portugal."}},
}


ROUTE_HIGHLIGHT: dict = {
    "pt-n103": {
        "pt": "O troço espectacular começa em Esposende. A partir daqui, 130 km de montanha pelo Parque Nacional Peneda-Gerês até Chaves — curvas, altitude e paisagem transmontana.",
        "en": "The spectacular section starts in Esposende. From here, 130 km of mountain roads through Peneda-Gerês National Park to Chaves — curves, altitude and transmontane scenery.",
    }
}


# --- GPX parsing & geometry helpers -------------------------------------

def parse_gpx(path: Path, trim_south_lat: float | None = None, trim_west_lon: float | None = None) -> list[dict]:
    with open(path) as f:
        gpx = gpxpy.parse(f)
    pts = []
    for track in gpx.tracks:
        for seg in track.segments:
            for p in seg.points:
                pts.append({"lat": p.latitude, "lon": p.longitude, "ele": p.elevation or 0.0})
    if trim_south_lat is not None:
        before = len(pts)
        pts = [p for p in pts if p["lat"] >= trim_south_lat]
        print(f"    Trimmed to lat >= {trim_south_lat}: {before} → {len(pts)} pts")
    if trim_west_lon is not None:
        before = len(pts)
        pts = [p for p in pts if p["lon"] >= trim_west_lon]
        print(f"    Trimmed to lon >= {trim_west_lon}: {before} → {len(pts)} pts")
    if not pts:
        print(f"  WARNING: no track points in {path.name}")
    return pts


def downsample(pts: list[dict], cap: int = MAX_TRACK_POINTS) -> list[dict]:
    if len(pts) <= cap:
        return pts
    step = len(pts) // cap
    result = pts[::step]
    if result[-1] is not pts[-1]:
        result.append(pts[-1])
    print(f"    Downsampled {len(pts)} → {len(result)} points")
    return result


def calc_metrics(pts: list[dict]) -> dict:
    if len(pts) < 2:
        return {"distance_km": 0, "elevation_max": 0, "elevation_min": 0,
                "elevation_gain": 0, "elevation_loss": 0}
    dist = gain = loss = 0.0
    eles = [p["ele"] for p in pts]
    for i in range(1, len(pts)):
        dist += geodesic((pts[i-1]["lat"], pts[i-1]["lon"]), (pts[i]["lat"], pts[i]["lon"])).km
        d = pts[i]["ele"] - pts[i-1]["ele"]
        if d > 0: gain += d
        else: loss += abs(d)
    return {"distance_km": round(dist, 2), "elevation_max": int(max(eles)),
            "elevation_min": int(min(eles)), "elevation_gain": int(gain), "elevation_loss": int(loss)}


def _bearing(a: dict, b: dict) -> float:
    la, lb = math.radians(a["lat"]), math.radians(b["lat"])
    dl = math.radians(b["lon"] - a["lon"])
    x = math.sin(dl) * math.cos(lb)
    y = math.cos(la) * math.sin(lb) - math.sin(la) * math.cos(lb) * math.cos(dl)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def count_curves(pts: list[dict]) -> dict:
    # Resample at 50m intervals to eliminate GPS jitter
    sampled, acc = [pts[0]], 0.0
    for i in range(1, len(pts)):
        acc += geodesic((pts[i-1]["lat"], pts[i-1]["lon"]), (pts[i]["lat"], pts[i]["lon"])).m
        while acc >= 50.0:
            acc -= 50.0
            sampled.append(pts[i])
    gentle = moderate = sharp = 0
    for i in range(1, len(sampled) - 1):
        diff = abs(_bearing(sampled[i-1], sampled[i]) - _bearing(sampled[i], sampled[i+1])) % 360
        if diff > 180: diff = 360 - diff
        if diff >= 90: sharp += 1
        elif diff >= 45: moderate += 1
        elif diff >= 15: gentle += 1
    return {"curve_count_gentle": gentle, "curve_count_moderate": moderate,
            "curve_count_sharp": sharp, "curve_count_total": gentle + moderate + sharp}


def ls_ewkt(pts: list[dict]) -> str:
    return "SRID=4326;LINESTRING(" + ", ".join(f"{p['lon']} {p['lat']}" for p in pts) + ")"

def poly_ewkt(min_lon: float, max_lon: float, min_lat: float, max_lat: float) -> str:
    return (f"SRID=4326;POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},"
            f"{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))")

def pt_ewkt(lon: float, lat: float) -> str:
    return f"SRID=4326;POINT({lon} {lat})"

def geojson_ls(pts: list[dict]) -> dict:
    return {"type": "LineString", "coordinates": [[p["lon"], p["lat"]] for p in pts]}


# --- Insertion functions ------------------------------------------------

def insert_routes(db: Client) -> dict[str, str]:
    print("\nInserting routes...")
    id_map: dict[str, str] = {}
    base = [r for r in ROUTES if not r["parent_code"]]
    deps = [r for r in ROUTES if r["parent_code"]]
    for rd in base + deps:
        code = rd["code"]
        print(f"  {code}")
        gpx_path = DATA_DIR / rd["gpx"]
        if not gpx_path.exists():
            print(f"  ERROR: {gpx_path} not found"); sys.exit(1)
        raw = parse_gpx(gpx_path, rd.get("trim_south_lat"), rd.get("trim_west_lon"))
        if not raw:
            print(f"  ERROR: no points in {gpx_path.name}"); sys.exit(1)
        print(f"    Raw: {len(raw)} pts")
        stored = downsample(raw)
        highlight = ROUTE_HIGHLIGHT.get(rd["slug"], {})
        row: dict = {
            "code": code, "slug": rd["slug"], "name": rd["name"],
            "landscape_type": rd["landscape_type"], "surface": "asphalt",
            "difficulty": rd["difficulty"], "data_source": "gpx",
            "geometry": ls_ewkt(stored), "geometry_geojson": geojson_ls(stored),
            **calc_metrics(raw), **count_curves(raw),
        }
        row["highlight_note_pt"] = highlight.get("pt")
        row["highlight_note_en"] = highlight.get("en")
        if rd["parent_code"] and rd["relationship"]:
            pid = id_map.get(rd["parent_code"])
            if not pid:
                print(f"  ERROR: parent '{rd['parent_code']}' not inserted yet"); sys.exit(1)
            row[rd["relationship"]] = pid
        resp = db.table("routes").upsert(row, on_conflict="code").execute()
        if not resp.data:
            print(f"  ERROR: upsert failed for {code}"); sys.exit(1)
        id_map[code] = resp.data[0]["id"]
        print(f"    dist={row['distance_km']}km curves={row['curve_count_total']} id={id_map[code]}")
    return id_map


def insert_journeys(db: Client, id_map: dict[str, str]) -> None:
    print("\nInserting journeys...")
    for jd in JOURNEYS:
        resp = db.table("journeys").upsert(
            {"name": jd["name"], "slug": jd["slug"], "type": jd["type"],
             "description": jd["description"], "suggested_days": jd["suggested_days"]},
            on_conflict="slug",
        ).execute()
        if not resp.data:
            print(f"  ERROR: upsert failed for journey {jd['slug']}"); sys.exit(1)
        jid = resp.data[0]["id"]
        db.table("journey_stages").delete().eq("journey_id", jid).execute()
        stages = []
        for route_code, order, stage_name in jd["stages"]:
            rid = id_map.get(route_code)
            if not rid:
                print(f"  ERROR: route '{route_code}' not found for stage"); sys.exit(1)
            stages.append({"journey_id": jid, "route_id": rid, "stage_order": order, "stage_name": stage_name})
        db.table("journey_stages").insert(stages).execute()
        print(f"  {jd['slug']} — id={jid} stages={len(stages)}")


def insert_destinations(db: Client, id_map: dict[str, str]) -> None:
    print("\nInserting destinations...")
    for dd in DESTINATIONS:
        mn, mx, mla, mxa = dd["bbox"]
        resp = db.table("destinations").upsert(
            {"name": dd["name"], "slug": dd["slug"], "description": dd["description"],
             "bounding_box": poly_ewkt(mn, mx, mla, mxa)},
            on_conflict="slug",
        ).execute()
        if not resp.data:
            print(f"  ERROR: upsert failed for destination {dd['slug']}"); sys.exit(1)
        did = resp.data[0]["id"]
        db.table("destination_featured_routes").delete().eq("destination_id", did).execute()
        featured = [{"destination_id": did, "route_id": id_map[c], "display_order": i}
                    for i, c in enumerate(dd["featured"], 1) if id_map.get(c)]
        if featured:
            db.table("destination_featured_routes").insert(featured).execute()
        print(f"  {dd['slug']} — id={did} featured={len(featured)}")


def insert_pois(db: Client, id_map: dict[str, str]) -> None:
    print("\nInserting POIs...")
    for name, ptype, lon, lat, desc, assoc, dist_m, route_code, km in POIS:
        row = {"name": name, "type": ptype, "geometry": pt_ewkt(lon, lat),
               "description": desc, "association_type": assoc, "distance_meters": dist_m}
        existing = db.table("pois").select("id").eq("name", name).execute()
        if existing.data:
            poi_id = existing.data[0]["id"]
            db.table("pois").update(row).eq("id", poi_id).execute()
        else:
            resp = db.table("pois").insert(row).execute()
            if not resp.data:
                print(f"  ERROR: insert failed for POI '{name}'"); sys.exit(1)
            poi_id = resp.data[0]["id"]
        rid = id_map.get(route_code)
        if rid:
            db.table("route_pois").upsert(
                {"route_id": rid, "poi_id": poi_id, "km_marker": km},
                on_conflict="route_id,poi_id",
            ).execute()
        print(f"  {name} — id={poi_id}")


def insert_translations(db: Client, id_map: dict[str, str]) -> None:
    print("\nInserting translations...")
    rows = []
    for code, langs in ROUTE_TR.items():
        eid = id_map.get(code)
        if eid:
            for lang, fields in langs.items():
                for field, value in fields.items():
                    rows.append({"entity_type": "routes", "entity_id": eid, "field": field, "lang": lang, "value": value})
    # Journey translations
    jresp = db.table("journeys").select("id,slug").in_("slug", list(JOURNEY_TR)).execute()
    slug_j = {r["slug"]: r["id"] for r in jresp.data}
    for slug, langs in JOURNEY_TR.items():
        eid = slug_j.get(slug)
        if eid:
            for lang, fields in langs.items():
                for field, value in fields.items():
                    rows.append({"entity_type": "journeys", "entity_id": eid, "field": field, "lang": lang, "value": value})
    # Destination translations
    dresp = db.table("destinations").select("id,slug").in_("slug", list(DEST_TR)).execute()
    slug_d = {r["slug"]: r["id"] for r in dresp.data}
    for slug, langs in DEST_TR.items():
        eid = slug_d.get(slug)
        if eid:
            for lang, fields in langs.items():
                for field, value in fields.items():
                    rows.append({"entity_type": "destinations", "entity_id": eid, "field": field, "lang": lang, "value": value})
    db.table("translations").upsert(rows, on_conflict="entity_type,entity_id,field,lang").execute()
    print(f"  Upserted {len(rows)} rows")


# --- Validation ---------------------------------------------------------

def validate(db: Client) -> bool:
    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)
    checks = [
        ("routes",                    8,  lambda: db.table("routes").select("id", count="exact").execute().count),
        ("routes with landscape_type",8,  lambda: db.table("routes").select("id", count="exact").not_.is_("landscape_type", "null").execute().count),
        ("journeys",                  2,  lambda: db.table("journeys").select("id", count="exact").execute().count),
        ("destinations",              2,  lambda: db.table("destinations").select("id", count="exact").execute().count),
        ("pois",                      5,  lambda: db.table("pois").select("id", count="exact").execute().count),
        ("translations",             14,  lambda: db.table("translations").select("id", count="exact").execute().count),
    ]
    ok = True
    for name, minimum, fn in checks:
        n = fn() or 0
        passed = n >= minimum
        print(f"  {'✓' if passed else '✗'} {name}: {n} (min {minimum})")
        if not passed: ok = False
    print("=" * 60)
    print("Phase 2 COMPLETE" if ok else "Phase 2 INCOMPLETE — check errors above")
    return ok


# --- Entry point --------------------------------------------------------

def main() -> None:
    print("=" * 60)
    print("Moto Routes v4 — Phase 2: Data Pipeline")
    print("=" * 60)
    print(f"Supabase: {SUPABASE_URL}\n")
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    id_map = insert_routes(db)
    insert_journeys(db, id_map)
    insert_destinations(db, id_map)
    insert_pois(db, id_map)
    insert_translations(db, id_map)
    sys.exit(0 if validate(db) else 1)


if __name__ == "__main__":
    main()
