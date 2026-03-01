"""
import_geographic_areas.py — Populate geographic_areas table
Run: uv run --with requests --with psycopg2-binary python scripts/import_geographic_areas.py

Sections (each idempotent via ON CONFLICT DO NOTHING):
  1. Anchor hierarchy — Europa, Portugal, Espanha, macro-regions (no geometry)
  2. CAOP 2024.1 — Portuguese districts + municipalities (polygon geometry)
  3. Overpass API — Natural parks in PT (polygon geometry)
  4. GADM 4.1 — Spanish regions (Galícia, Catalunha) (polygon geometry)
  5. Províncias históricas PT — Manual approximation (no geometry, descriptive only)
"""

import json
import os
import sys
import time
from typing import Optional

import psycopg2
import requests

# ---------------------------------------------------------------------------
# Connection — reads SUPABASE_DB_URL or falls back to individual vars
# ---------------------------------------------------------------------------
DB_URL = os.environ.get("SUPABASE_DB_URL")
if not DB_URL:
    host = os.environ.get("SUPABASE_DB_HOST", "")
    password = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not host:
        # Fallback: connect via Supabase project ref
        project_ref = "epaxdcbvbysjrnwuffay"
        host = f"db.{project_ref}.supabase.co"
    DB_URL = f"postgresql://postgres:{password}@{host}:5432/postgres"


def connect():
    return psycopg2.connect(DB_URL)


def insert_area(cur, name: str, slug: str, level: str, parent_slug: Optional[str],
                country_code: Optional[str], display_order: int = 0,
                description: Optional[str] = None,
                geojson_geometry: Optional[dict] = None) -> Optional[str]:
    """Insert a geographic area, returning its id. Skips if slug already exists."""
    parent_id = None
    if parent_slug:
        cur.execute("SELECT id FROM geographic_areas WHERE slug = %s", (parent_slug,))
        row = cur.fetchone()
        if row:
            parent_id = row[0]
        else:
            print(f"  [WARN] parent slug '{parent_slug}' not found for '{slug}'")

    geom_sql = None
    if geojson_geometry:
        geom_sql = f"ST_Multi(ST_GeomFromGeoJSON('{json.dumps(geojson_geometry)}'))"

    if geom_sql:
        cur.execute(
            f"""
            INSERT INTO geographic_areas (name, slug, level, parent_id, country_code, display_order, description, geom)
            VALUES (%s, %s, %s::geo_level, %s, %s, %s, %s, {geom_sql})
            ON CONFLICT (slug) DO NOTHING
            RETURNING id
            """,
            (name, slug, level, parent_id, country_code, display_order, description),
        )
    else:
        cur.execute(
            """
            INSERT INTO geographic_areas (name, slug, level, parent_id, country_code, display_order, description)
            VALUES (%s, %s, %s::geo_level, %s, %s, %s, %s)
            ON CONFLICT (slug) DO NOTHING
            RETURNING id
            """,
            (name, slug, level, parent_id, country_code, display_order, description),
        )

    row = cur.fetchone()
    if row:
        return row[0]
    # Already existed — fetch id
    cur.execute("SELECT id FROM geographic_areas WHERE slug = %s", (slug,))
    row = cur.fetchone()
    return row[0] if row else None


# ---------------------------------------------------------------------------
# Section 1 — Anchor hierarchy (no geometry)
# ---------------------------------------------------------------------------
def section1_anchor_hierarchy(conn):
    print("\n[1/5] Anchor hierarchy...")
    with conn.cursor() as cur:
        insert_area(cur, "Europa", "europa", "continent", None, None, 0)
        insert_area(cur, "Portugal", "portugal", "country", "europa", "pt", 0,
                    "Portugal continental e ilhas")
        insert_area(cur, "Espanha", "espanha", "country", "europa", "es", 1,
                    "Reino de Espanha")

        # PT macro-regions
        pt_macros = [
            ("Norte", "pt-norte", "pt", 0),
            ("Centro", "pt-centro", "pt", 1),
            ("Área Metropolitana de Lisboa", "pt-aml", "pt", 2),
            ("Alentejo", "pt-alentejo", "pt", 3),
            ("Algarve", "pt-algarve", "pt", 4),
        ]
        for name, slug, cc, order in pt_macros:
            insert_area(cur, name, slug, "macro_region", "portugal", cc, order)

        # ES macro-regions relevant to moto routes
        es_macros = [
            ("Galícia", "es-galicia", "es", 0),
            ("Catalunha", "es-catalunha", "es", 1),
            ("Castela e Leão", "es-castela-leao", "es", 2),
        ]
        for name, slug, cc, order in es_macros:
            insert_area(cur, name, slug, "macro_region", "espanha", cc, order)

    conn.commit()
    print("  ✓ Anchor hierarchy inserted")


# ---------------------------------------------------------------------------
# Section 2 — CAOP 2024.1: Portuguese districts
# ---------------------------------------------------------------------------
CAOP_DISTRICTS_URL = (
    "https://raw.githubusercontent.com/dssg-pt/mp-distritos/main/data/distritos.geojson"
)

DISTRICT_TO_MACRO = {
    "Viana do Castelo": "pt-norte",
    "Braga": "pt-norte",
    "Vila Real": "pt-norte",
    "Bragança": "pt-norte",
    "Porto": "pt-norte",
    "Aveiro": "pt-centro",
    "Viseu": "pt-centro",
    "Guarda": "pt-centro",
    "Coimbra": "pt-centro",
    "Castelo Branco": "pt-centro",
    "Leiria": "pt-centro",
    "Lisboa": "pt-aml",
    "Setúbal": "pt-aml",
    "Santarém": "pt-aml",
    "Portalegre": "pt-alentejo",
    "Évora": "pt-alentejo",
    "Beja": "pt-alentejo",
    "Faro": "pt-algarve",
}


def slugify(text: str) -> str:
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return ascii_str.lower().replace(" ", "-").replace("'", "").replace(".", "")


def section2_caop_districts(conn):
    print("\n[2/5] CAOP districts...")
    try:
        resp = requests.get(CAOP_DISTRICTS_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  [WARN] Could not fetch CAOP districts: {e}")
        print("  Inserting districts without geometry...")
        data = None

    with conn.cursor() as cur:
        if data:
            features = data.get("features", [])
            print(f"  Found {len(features)} districts")
            for i, feat in enumerate(features):
                props = feat.get("properties", {})
                name = props.get("NAME_1") or props.get("Distrito") or props.get("name") or f"Distrito {i}"
                geom = feat.get("geometry")

                # Ensure MultiPolygon
                if geom and geom["type"] == "Polygon":
                    geom = {"type": "MultiPolygon", "coordinates": [geom["coordinates"]]}

                slug = f"pt-distrito-{slugify(name)}"
                parent = DISTRICT_TO_MACRO.get(name, "portugal")
                insert_area(cur, name, slug, "district", parent, "pt", i, geojson_geometry=geom)
        else:
            # Fallback: insert districts without geometry
            for i, (name, macro) in enumerate(DISTRICT_TO_MACRO.items()):
                slug = f"pt-distrito-{slugify(name)}"
                insert_area(cur, name, slug, "district", macro, "pt", i)

    conn.commit()
    print("  ✓ Districts processed")


# ---------------------------------------------------------------------------
# Section 3 — Overpass API: Portuguese national/natural parks
# ---------------------------------------------------------------------------
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_QUERY = """
[out:json][timeout:60];
(
  relation["boundary"="national_park"]["name"]["name:pt"](38.5,-9.5,42,-6.2);
  relation["boundary"="protected_area"]["protect_class"="2"]["name"]["name:pt"](38.5,-9.5,42,-6.2);
);
out geom;
"""

PARKS_MANUAL = [
    ("Parque Nacional Peneda-Gerês", "pt-pnpg", "pt-norte"),
    ("Parque Natural do Alvão", "pt-pna", "pt-norte"),
    ("Parque Natural de Montesinho", "pt-pnm", "pt-norte"),
    ("Parque Natural da Serra da Estrela", "pt-pnse", "pt-centro"),
    ("Parque Natural do Douro Internacional", "pt-pndi", "pt-norte"),
]


def overpass_relation_to_multipolygon(element: dict) -> Optional[dict]:
    """Convert Overpass relation geometry to approximate MultiPolygon."""
    members = element.get("members", [])
    outer_rings = []
    for m in members:
        if m.get("type") == "way" and m.get("role") in ("outer", ""):
            geom = m.get("geometry", [])
            if len(geom) >= 3:
                coords = [[p["lon"], p["lat"]] for p in geom]
                if coords[0] != coords[-1]:
                    coords.append(coords[0])
                outer_rings.append([coords])

    if not outer_rings:
        return None
    return {"type": "MultiPolygon", "coordinates": outer_rings}


def section3_natural_parks(conn):
    print("\n[3/5] Natural parks via Overpass...")
    try:
        resp = requests.post(OVERPASS_URL, data={"data": OVERPASS_QUERY}, timeout=90)
        resp.raise_for_status()
        data = resp.json()
        elements = data.get("elements", [])
        print(f"  Found {len(elements)} park relations")

        with conn.cursor() as cur:
            inserted = 0
            for elem in elements:
                tags = elem.get("tags", {})
                name = tags.get("name:pt") or tags.get("name", "")
                if not name:
                    continue
                slug = f"pt-parque-{slugify(name)}"
                geom = overpass_relation_to_multipolygon(elem)
                parent = "pt-norte" if any(k in name.lower() for k in ["gerês", "alvão", "montesinho", "douro"]) else "pt-centro"
                insert_area(cur, name, slug, "natural_park", parent, "pt", 0, geojson_geometry=geom)
                inserted += 1
            conn.commit()
            print(f"  ✓ {inserted} parks inserted from Overpass")

    except Exception as e:
        print(f"  [WARN] Overpass failed ({e}), using manual fallback...")
        with conn.cursor() as cur:
            for i, (name, slug, parent) in enumerate(PARKS_MANUAL):
                insert_area(cur, name, slug, "natural_park", parent, "pt", i)
        conn.commit()
        print(f"  ✓ {len(PARKS_MANUAL)} parks inserted (manual)")


# ---------------------------------------------------------------------------
# Section 4 — GADM 4.1: Spanish regions (Galícia, Catalunha)
# ---------------------------------------------------------------------------
GADM_ES_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ESP_1.json"

SPAIN_REGIONS_OF_INTEREST = {
    "Galicia": ("Galícia", "es-galicia"),
    "Cataluña": ("Catalunha", "es-catalunha"),
    "Castilla y León": ("Castela e Leão", "es-castela-leao"),
}


def section4_gadm_spain(conn):
    print("\n[4/5] GADM Spain regions...")
    try:
        resp = requests.get(GADM_ES_URL, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        features = data.get("features", [])
        print(f"  Found {len(features)} Spanish regions")

        with conn.cursor() as cur:
            inserted = 0
            for feat in features:
                props = feat.get("properties", {})
                name_es = props.get("NAME_1", "")
                if name_es not in SPAIN_REGIONS_OF_INTEREST:
                    continue

                pt_name, slug = SPAIN_REGIONS_OF_INTEREST[name_es]
                geom = feat.get("geometry")
                if geom and geom["type"] == "Polygon":
                    geom = {"type": "MultiPolygon", "coordinates": [geom["coordinates"]]}

                insert_area(cur, pt_name, slug, "macro_region", "espanha", "es", 0,
                            geojson_geometry=geom)
                inserted += 1

        conn.commit()
        print(f"  ✓ {inserted} Spanish regions updated with geometry")

    except Exception as e:
        print(f"  [WARN] GADM Spain failed ({e}) — regions already exist without geometry")


# ---------------------------------------------------------------------------
# Section 5 — Províncias históricas PT (manual, no geometry)
# ---------------------------------------------------------------------------
PROVINCIAS_HISTORICAS = [
    ("Minho", "pt-minho", "pt-norte", "Antiga província do Minho, berço de Portugal"),
    ("Douro Litoral", "pt-douro-litoral", "pt-norte", "Litoral duriense, da foz do Douro a Aveiro"),
    ("Trás-os-Montes", "pt-tras-os-montes", "pt-norte", "Planalto transmontano, fronteira com Espanha"),
    ("Beira Alta", "pt-beira-alta", "pt-centro", "Terras altas da Beira, Serra da Estrela"),
    ("Beira Baixa", "pt-beira-baixa", "pt-centro", "Planícies da Beira, fronteira com Espanha"),
    ("Beira Litoral", "pt-beira-litoral", "pt-centro", "Costa da Prata, de Aveiro a Leiria"),
    ("Estremadura", "pt-estremadura", "pt-aml", "Litoral central, de Leiria a Lisboa"),
    ("Ribatejo", "pt-ribatejo", "pt-aml", "Vale do Tejo, planícies férteis"),
    ("Alto Alentejo", "pt-alto-alentejo", "pt-alentejo", "Serra de São Mamede e montado"),
    ("Baixo Alentejo", "pt-baixo-alentejo", "pt-alentejo", "Grandes planícies alentejanas"),
    ("Algarve", "pt-algarve-provincia", "pt-algarve", "O barlavento e sotavento algarvio"),
]


def section5_provincias_historicas(conn):
    print("\n[5/5] Províncias históricas PT...")
    with conn.cursor() as cur:
        for i, (name, slug, parent, desc) in enumerate(PROVINCIAS_HISTORICAS):
            insert_area(cur, name, slug, "historic_province", parent, "pt", i, desc)
    conn.commit()
    print(f"  ✓ {len(PROVINCIAS_HISTORICAS)} províncias históricas inserted")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("import_geographic_areas.py")
    print("=" * 60)

    try:
        conn = connect()
        print("✓ Connected to database")
    except Exception as e:
        print(f"✗ Could not connect: {e}")
        print("\nSet SUPABASE_DB_URL or SUPABASE_DB_HOST + SUPABASE_SERVICE_KEY")
        sys.exit(1)

    try:
        section1_anchor_hierarchy(conn)
        section2_caop_districts(conn)
        section3_natural_parks(conn)
        section4_gadm_spain(conn)
        section5_provincias_historicas(conn)

        # Summary
        with conn.cursor() as cur:
            cur.execute("SELECT level, COUNT(*) FROM geographic_areas GROUP BY level ORDER BY level")
            rows = cur.fetchall()
        print("\n=== Summary ===")
        for level, count in rows:
            print(f"  {level}: {count}")

        print("\n✓ Done")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
