# Moto Routes v4 Architecture

> System architecture overview.

---

## 4-Layer Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESTINATION                               │
│                   (Geographic Aggregation)                       │
│                                                                  │
│  Ex: Peneda-Gerês, Serra da Estrela, Douro Valley                │
│  Purpose: Aggregate content by location                          │
│  Answers: "What to do in [place]?"                               │
│  Fields: bounding_box, featured_routes                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ contains
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         JOURNEY                                  │
│                    (Multi-Stage Trip)                            │
│                                                                  │
│  Ex: Northern Route 777km, N2 Chaves→Faro                        │
│  Purpose: Thematic composition of routes                         │
│  Answers: "Plan a multi-day trip"                                │
│  Fields: stages[], total_distance, suggested_days                │
└────────────────────────────┬────────────────────────────────────┘
                             │ composed of
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ROUTE                                   │
│                   (GPX Traceable Path)                           │
│                                                                  │
│  Ex: N222 Douro Valley, N304-Alvão                               │
│  Purpose: Navigable, downloadable path                           │
│  ALWAYS has geometry (GPX file)                                  │
│  Fields: geometry, distance_km, elevation, curves                │
└────────────────────────────┬────────────────────────────────────┘
                             │ references (optional)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                           ROAD                                   │
│                (Administrative Designation)                      │
│                                                                  │
│  Ex: EN304, N222, N2                                             │
│  Purpose: Reference, grouping, context                           │
│  NEVER has mandatory geometry (abstract)                         │
│  Fields: code, designation, status, wikipedia_url                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   GPX Files      │────▶│  Python Script   │────▶│    Supabase      │
│   (data/)        │     │  (import_gpx.py) │     │   (PostgreSQL    │
│                  │     │                  │     │    + PostGIS)    │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           │ API
                                                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│     Browser      │◀────│   React App      │◀────│  Supabase Client │
│                  │     │  (Mapbox GL JS)  │     │                  │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Tech Stack

### Frontend
```
React 19 + TypeScript + Vite
         │
         ├── Tailwind CSS (styling)
         ├── Mapbox GL JS (maps)
         ├── React Router (navigation)
         └── Supabase JS (data)
```

### Backend
```
Supabase
    │
    ├── PostgreSQL (data)
    ├── PostGIS (geospatial)
    ├── Auth (users)
    └── Row Level Security (permissions)
```

### Pipeline
```
Python 3.11+
    │
    ├── gpxpy (GPX parsing)
    ├── geopy (geodesic calculations)
    └── supabase-py (DB insertion)
```

---

## Folder Structure

```
moto-routes-v4/
├── CLAUDE.md              # Instructions for Claude
├── CHANGELOG.md           # History
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # This file
│   ├── SCHEMA.md          # Database schema
│   ├── DECISIONS.md       # Technical decisions
│   └── ...
│
├── data/                  # GPX files
│   ├── pt/                # Portugal
│   └── es/                # Spain
│
├── scripts/               # Python pipeline
│   ├── schema.sql         # DB schema
│   └── import_gpx.py      # Route import
│
├── frontend/              # React application
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # Custom hooks
│       ├── services/      # API/Supabase
│       ├── types/         # TypeScript types
│       ├── pages/         # Pages/routes
│       └── i18n/          # Translations
│
└── .claude/               # Claude Code config
    ├── skills/            # Custom skills
    └── agents/            # Custom agents
```

---

## Data Model (Simplified)

```
┌──────────────────┐       ┌──────────────────┐
│   destinations   │       │    journeys      │
├──────────────────┤       ├──────────────────┤
│ id               │       │ id               │
│ name             │       │ name             │
│ slug             │       │ slug             │
│ bounding_box     │       │ type             │
│ description      │       │ description      │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ featured                 │ stages
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│     routes       │◀──────│  journey_stages  │
├──────────────────┤       ├──────────────────┤
│ id               │       │ journey_id       │
│ code             │       │ route_id         │
│ name             │       │ stage_order      │
│ geometry         │       └──────────────────┘
│ geometry_geojson │
│ distance_km      │       ┌──────────────────┐
│ elevation_*      │       │      pois        │
│ curve_count_*    │       ├──────────────────┤
│ landscape_type   │       │ id               │
│ road_id ─────────┼──┐    │ name             │
└────────┬─────────┘  │    │ type             │
         │            │    │ geometry         │
         │ has        │    │ association_type │
         ▼            │    │ distance_meters  │
┌──────────────────┐  │    └────────┬─────────┘
│    route_pois    │  │             │
├──────────────────┤  │             │
│ route_id         │◀─┼─────────────┘
│ poi_id           │  │
│ km_marker        │  │
└──────────────────┘  │
                      │
                      ▼
              ┌──────────────────┐
              │      roads       │
              ├──────────────────┤
              │ id               │
              │ code             │
              │ designation      │
              │ status           │
              └──────────────────┘
```

---

## ENUMs

```sql
-- Landscape type
landscape_type: coast | mountain | forest | urban | river_valley | mixed

-- POI association
poi_association_type: on_route | near_route | detour

-- POI type
poi_type: viewpoint | restaurant | fuel_station | waterfall | village | historical_site
```

---

## Coordinates

**IMPORTANT**: Always use `(longitude, latitude)` order.

See `/coordinate-rules` for complete coordinate rules.

```javascript
// Correct (Mapbox/GeoJSON standard)
const point = [longitude, latitude];
const point = [-7.9134, 41.1404]; // Porto

// WRONG (Google Maps standard)
const point = [latitude, longitude];
```

---

## Related Documents

- [Schema](./SCHEMA.md) - Database schema
- [Decisions](./DECISIONS.md) - Technical decisions
- [Patterns](./PATTERNS.md) - Best practices
