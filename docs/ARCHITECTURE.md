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
└────────────────────────┬────────────────────────────────────────┘
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
└────────────────────────┬────────────────────────────────────────┘
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
└────────────────────────┬────────────────────────────────────────┘
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

## Stack Rationale

| Technology | Version | Why |
|------------|---------|-----|
| React | 19.x | Component model fits map+sidebar UI; large ecosystem |
| TypeScript | 5.x | Compile-time safety; essential for Supabase type contracts |
| Vite | 7.x | Fast HMR; native ESM; zero config for TS |
| Tailwind CSS | 4.x | Utility-first speeds development; v4 needs no config file |
| Mapbox GL JS | 3.x | Best-in-class vector maps; smooth line animations; 50k loads/month free |
| React Router | 7.x | URL-synced selection state (`/routes/:slug`) |
| Supabase | 2.x | PostgreSQL + PostGIS + Auth + RLS — no backend server needed |
| PostGIS | 3.4+ | `ST_X`/`ST_Y` extracts coordinates; `ST_AsGeoJSON` for frontend |
| Vercel | — | Zero-config Vite deploy; global CDN; free tier sufficient |
| Python 3.11+ | — | `gpxpy` for GPX parsing; `geopy` for geodesic calculations |

**Cost**: $0/month. Vercel free + Supabase free (< 100 MB DB) + Mapbox free tier (< 1k loads/month).

---

## Tech Stack

### Frontend
```
React 19 + TypeScript + Vite
         │
         ├── Tailwind CSS (styling)
         ├── Mapbox GL JS (maps)
         ├── React Router (navigation)
         ├── i18next (UI strings)
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
├── CLAUDE.md              # Dev instructions
├── CHANGELOG.md           # Change history
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
│       │   ├── AppShell/  # NavHeader, MobileTabBar, LanguageSwitcher
│       │   ├── Auth/      # LoginModal, UserMenu
│       │   ├── Destinations/
│       │   ├── Journeys/
│       │   ├── Map/       # RouteMap, JourneyMap, DestinationMap, mapLayers.ts
│       │   └── Routes/    # RouteList, RouteDetails, POIList, FavoriteButton
│       ├── hooks/         # Data fetching + state
│       ├── lib/           # supabase.ts, translations.ts
│       ├── types/         # database.ts (hand-written Supabase types)
│       ├── pages/         # RoutesPage, JourneysPage, DestinationsPage, ProfilePage
│       ├── locales/       # pt.json, en.json (UI strings)
│       └── i18n/          # i18next init
│
└── .claude/               # Claude Code config
    ├── skills/            # Custom skills
    └── agents/            # Custom agents
```

---

## Page Layout Pattern

Each section (Routes, Journeys, Destinations) follows the same pattern:

- **Desktop**: map on right + sidebar on left (280px fixed width)
- **Mobile**: full-screen map + draggable bottom sheet (snaps at 65vh / 92vh)
- **URL sync**: `/:section/:slug` pre-selects an item on load; `useParams` + `useNavigate` keep URL in sync
- `useIsMobile` detects mobile breakpoint; `useSheetDrag` handles drag-to-dismiss and snap points

---

## Map Architecture

All Mapbox source/layer identifiers and helper functions live in `components/Map/mapLayers.ts`. Each section has its own Map component (`RouteMap`, `JourneyMap`, `DestinationMap`).

```typescript
// Only RouteMap.tsx uses the full import (initialises the map)
import mapboxgl from 'mapbox-gl'
// All other map files use type-only imports
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
```

Layer ordering matters: route lines first, POI circles/labels on top.

---

## Route Hierarchy

Routes support a self-referential hierarchy via three optional FK columns on the `routes` table:

| Column | Meaning |
|--------|---------|
| `is_segment_of` | This route is a segment (part) of another route |
| `is_extension_of` | This route is an extension or detour of another route |
| `is_variant_of` | This route is an alternative variant of another route |

### State management in `RoutesPage`

- `useRoutes` returns both `routes` (all) and `rootRoutes` (routes with no parent FK set)
- The list always shows `rootRoutes` — sub-routes are hidden until a parent is selected
- `activeSubRoute: Route | null` tracks the currently-viewed child route
- `effectiveRoute = activeSubRoute ?? selectedRoute` — the sub-route takes display priority over the parent
- `mapSubRoutes` — when viewing a parent (no active sub-route), children are rendered on the map as dashed lines via the `subRoutes` prop on `RouteMap`
- Selecting a parent clears `activeSubRoute` via a `useEffect` on `selectedRoute?.id`

### UI

- **`RouteDetails`** shows a breadcrumb (back arrow + parent name) when `parentRoute` prop is set
- **`SubRouteSection`** in `DetailsContent` lists extensions, variants, and segments in separate labelled groups
- Route cards in `RouteList` display a badge with the count of children when `childrenCount[route.id] > 0`

---

## User Data

### Tables

| Table | Purpose | Access |
|-------|---------|--------|
| `user_favorites` | User's saved routes | Authenticated only (RLS) |
| `user_history` | Routes viewed by user | Authenticated only (RLS) |

Both tables reference `auth.users(id)` and `routes(id)`. RLS policies enforce that users can only read/write their own rows.

### Hooks

**`useAuth`** (`hooks/useAuth.ts`)
- Calls `supabase.auth.getSession()` on mount for the initial session
- Subscribes to `supabase.auth.onAuthStateChange` for live updates
- Exposes: `user: AuthUser | null`, `loading`, `login`, `signup`, `loginWithGoogle`, `logout`
- Google OAuth redirects to `window.location.origin + pathname`

**`useFavorites`** (`hooks/useFavorites.ts`)
- Depends on `useAuth` internally
- Stores `favoriteIds: Set<string>` for O(1) lookups via `isFavorite(routeId)`
- **Optimistic toggle**: updates local state immediately, then syncs to DB; rolls back on error
- Supabase join result (`routes(*)`) requires `(data as unknown) as FavoriteRow[]` cast

**`useHistory`** (`hooks/useHistory.ts`)
- Depends on `useAuth` internally
- `recordView(routeId)` is fire-and-forget: inserts a row then refreshes the list
- `RoutesPage` debounces `recordView` by 2 seconds after route selection (via `useRef<setTimeout>`)
- Returns the 20 most recent entries ordered by `viewed_at DESC`

---

## Translations & i18n

### Two-layer approach

1. **UI strings** — managed by `i18next` with JSON locale files (`locales/pt.json`, `locales/en.json`). Used for labels, buttons, error messages.
2. **Content translations** — stored in the `translations` DB table. Used for route names, descriptions, and other entity content.

### DB translations

The `translations` table stores one row per `(entity_type, entity_id, field, lang)`:

```
entity_type: 'routes' | 'journeys' | 'destinations' | 'pois'
entity_id:   UUID of the entity
field:       'name' | 'description' | ...
lang:        'pt' | 'en'
value:       translated text
```

`lib/translations.ts` provides `fetchTranslations(entityType, lang)` which returns a `Map<id, fields>`. Hooks merge these translations into entity objects before returning them to components.

### Language detection

i18next-browser-languagedetector checks `localStorage` first, then `navigator.language`. The `LanguageSwitcher` component writes the selection back to `localStorage`.

---

## Data Model (Simplified)

```
┌──────────────────┐         ┌──────────────────┐
│   destinations   │         │    journeys      │
├──────────────────┤         ├──────────────────┤
│ id               │         │ id               │
│ name             │         │ name             │
│ slug             │         │ slug             │
│ bounding_box     │         │ type             │
│ description      │         │ description      │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ featured                   │ stages
         ▼                            ▼
┌────────────────────────┐   ┌──────────────────┐
│ destination_featured_  │   │  journey_stages  │
│       routes           │   ├──────────────────┤
├────────────────────────┤   │ journey_id       │
│ destination_id         │   │ route_id         │
│ route_id               │   │ stage_order      │
│ display_order          │   └────────┬─────────┘
└────────┬───────────────┘            │
         │                            │
         ▼                            ▼
┌──────────────────────────────────────────────────┐
│                      routes                      │
├──────────────────────────────────────────────────┤
│ id, code, name, slug                             │
│ geometry, geometry_geojson                       │
│ distance_km, elevation_*                         │
│ curve_count_*                                    │
│ surface, difficulty, landscape_type              │
│ road_id ──────────────────────────────────────┐  │
│ is_segment_of ──┐  (self-referential FK)      │  │
│ is_extension_of─┤                             │  │
│ is_variant_of ──┘                             │  │
└──┬──────────────────────────────────────────┬─┘  │
   │                                          │    │
   │ has                                      │    ▼
   ▼                                          │  ┌──────────────────┐
┌──────────────────┐                          │  │      roads       │
│    route_pois    │                          │  ├──────────────────┤
├──────────────────┤                          │  │ id               │
│ route_id         │                          │  │ code             │
│ poi_id           │                          │  │ designation      │
│ km_marker        │                          │  │ status           │
└────────┬─────────┘                          │  └──────────────────┘
         │                                    │
         ▼                                    │
┌──────────────────┐   ┌──────────────────┐   │
│      pois        │   │  user_favorites  │◀──┘
├──────────────────┤   ├──────────────────┤
│ id               │   │ user_id          │
│ name             │   │ route_id         │
│ type             │   │ created_at       │
│ geometry (Point) │   └──────────────────┘
│ association_type │
│ distance_meters  │   ┌──────────────────┐
└──────────────────┘   │  user_history    │
                       ├──────────────────┤
┌──────────────────┐   │ id               │
│   translations   │   │ user_id          │
├──────────────────┤   │ route_id         │
│ entity_type      │   │ viewed_at        │
│ entity_id        │   └──────────────────┘
│ field            │
│ lang             │
│ value            │
└──────────────────┘
```

---

## ENUMs

```sql
-- Landscape type (7 values)
landscape_type: coast | mountain | forest | urban | river_valley | mixed | plains

-- POI association
poi_association_type: on_route | near_route | detour
```

---

## Coordinates

**IMPORTANT**: Always use `(longitude, latitude)` order.

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
