# Technical Decisions

> Record of all significant technical decisions for the project.
> Simplified ADR (Architecture Decision Record) format.

---

## MVP Requirements Decisions

> Decisions made on 2026-01-24 to define MVP scope.

| Question | Decision | Impact |
|----------|----------|--------|
| **Users** | Basic (favorites/history) | +2 tables, Supabase Auth |
| **Analytics** | Not for MVP | None |
| **Languages** | PT + EN (translations table) | +1 table, flexible i18n |
| **Elevation Profile** | Aggregates only (max, min, gain, loss) | Schema routes |
| **Images** | Hero image per route | hero_image_url field |
| **Landscape Tags** | Yes | +1 enum, +1 field |
| **Real-time** | Not for MVP | None |
| **Offline** | Not for MVP | None |

### Features Included in MVP

- Login/Logout (Supabase Auth)
- Save favorite routes
- Route viewing history
- Bilingual interface (PT/EN)
- Filter by landscape type (coast, mountain, forest, urban, valley, mixed)

### Features Excluded (post-MVP)

- Analytics/popularity metrics
- Real-time conditions (roadworks, closures)
- Offline support/PWA
- Interactive elevation profile

---

## Open Questions

> Questions to resolve during development.

- [x] How to present variants/extensions in UI? **RESOLVED** — Implemented as breadcrumb navigation (`← Parent Name`) + `SubRouteSection` component (extensions / variants / segments) + dashed lines on map for child routes (Phase 10).
- [ ] Merged or separate GPX export for Journeys? (both available?)

---

## Technical Decisions

## DEC-001: Use PostGIS for geometry

**Date**: 2026-01-24
**Status**: Accepted

**Context**
We need to store and query geospatial data (routes, POIs, bounding boxes).

**Decision**
Use PostGIS with `geometry(LineString, 4326)` type for routes and `geometry(Point, 4326)` for POIs.

**Rejected Alternatives**
- Plain GeoJSON in TEXT: Slow for spatial queries
- MongoDB with geospatial: More complex, less integrated with Supabase

**Consequences**
- (+) Efficient spatial queries (ST_Intersects, ST_Distance, ST_Within)
- (+) Fast bounding box queries
- (-) More complexity in initial setup
- (-) Requires spatial SQL knowledge

---

## DEC-002: Cache GeoJSON in separate column

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Frontend needs GeoJSON to render in Mapbox. Converting PostGIS to GeoJSON per request is costly.

**Decision**
Store pre-calculated `geometry_geojson TEXT` in each route.

**Consequences**
- (+) Frontend receives GeoJSON directly
- (+) No runtime conversion
- (-) Duplicated data (geometry + geojson)
- (-) Needs to stay synchronized

---

## DEC-003: 4-layer architecture

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Previous versions used flat model (routes only). This caused:
- Geometry duplication for composite routes
- Impossible to group by region
- Confusion between official roads and traceable segments

**Decision**
Implement 4 hierarchical layers:
1. **Destination** - Geographic aggregation
2. **Journey** - Multi-stage composition
3. **Route** - Traceable path with GPX
4. **Road** - Administrative designation (abstract)

**Consequences**
- (+) Route reuse in journeys
- (+) Discovery by region
- (+) Clear separation of concepts
- (-) More schema complexity
- (-) More queries to get complete data

---

## DEC-004: Coordinates (longitude, latitude)

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Confusion exists between lat/lon vs lon/lat order in different systems.

**Decision**
Always use `(longitude, latitude)` - Mapbox and GeoJSON standard.

**Consequences**
- (+) Consistency with Mapbox GL JS
- (+) Valid GeoJSON
- (-) Different from Google Maps (which uses lat/lon)
- (-) Requires attention when importing data

---

## DEC-005: Mobile-first design

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Motorcyclists check routes primarily on mobile phones.

**Decision**
Mobile-first design with Tailwind breakpoints. Bottom sheet for details instead of sidebar.

**Consequences**
- (+) Better UX for target audience
- (+) Works on any device
- (-) Desktop has more unused space

---

## DEC-006: GPX-first for data

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Previous OSM automation attempts failed (61% success). Portuguese roads are fragmented in OSM.

**Decision**
Use only real GPX files as data source. No automation.

**Consequences**
- (+) 100% guaranteed quality
- (+) Manually verified data
- (-) Slower growth
- (-) Requires manual route recording

---

## DEC-007: Standalone project (no external dependencies)

**Date**: 2026-01-26
**Status**: Accepted

**Context**
Initial documentation referenced files from previous versions (sr_v1, sr_v3, archive/).

**Decision**
Completely standalone project. No references to external code. Lessons learned documented as abstract patterns.

**Consequences**
- (+) Project can exist in any directory
- (+) No broken dependencies
- (+) Self-contained documentation
- (-) Code written from scratch (but with lessons learned)

---

## DEC-008: SQL RPC for extracting POI coordinates

**Date**: 2026-02-24
**Status**: Accepted

**Context**
The `pois` table stores location as `geometry(Point, 4326)` (PostGIS). The Supabase JavaScript client cannot deserialize PostGIS binary geometry — the column returns `null`. We need lon/lat coordinates for Mapbox GL markers.

**Decision**
Create a PostgreSQL function `get_pois_for_route(p_route_id uuid)` that uses `ST_X()` and `ST_Y()` to extract longitude and latitude, called via `supabase.rpc()`.

**Rejected Alternatives**
- Direct table query: Returns `geometry = null` — unusable in frontend
- Cache lon/lat columns (like `geometry_geojson` for routes): Would require maintaining 3 representations of the same geometry; RPC is cleaner for POIs since they're always fetched with route context
- PostgREST computed columns: More complex setup, less explicit

**Consequences**
- (+) Coordinates arrive as plain numbers — no client-side parsing
- (+) Single query fetches both POI metadata and coordinates
- (+) Can add filtering/ordering server-side easily
- (-) Requires a TypeScript workaround: `args as never` (Supabase RPC generic inference)
- (-) Function must be maintained alongside schema changes

---

## DEC-009: mapboxgl.Popup with inline HTML for POI popups

**Date**: 2026-02-24
**Status**: Accepted

**Context**
When a user clicks a POI marker on the map, we need to show a popup with name, type, and description. Two approaches are possible: React portal or mapboxgl.Popup.

**Decision**
Use `mapboxgl.Popup` with an HTML string template, managed via `useRef`. The popup is created imperatively inside a Mapbox event listener.

**Rejected Alternatives**
- React portal/component rendered into popup container: Mapbox's popup DOM container exists outside React's render tree; synchronising React lifecycle with Mapbox events adds complexity and risk of memory leaks
- Separate React overlay div positioned via map coordinates: Requires manual position tracking on map pan/zoom — fragile

**Consequences**
- (+) Popup follows Mapbox GL lifecycle natively (closes on map interaction, handles z-index correctly)
- (+) Simple — no extra state, no portal, no sync issues
- (+) Popup auto-positions to stay within viewport
- (-) HTML is a string template — no access to React state or components
- (-) Styling must be inline or via Mapbox popup CSS classes, not Tailwind

---

## DEC-010: Google OAuth via Supabase Auth

**Date**: 2026-02-25
**Status**: Accepted

**Context**
User authentication is required for favourites and history. Email/password alone creates friction and high drop-off rates.

**Decision**
Use Supabase Auth with Google OAuth as the primary sign-in method, with email/password as a fallback. The `loginWithGoogle` function calls `supabase.auth.signInWithOAuth` with `redirectTo: window.location.origin + window.location.pathname`.

**Consequences**
- (+) Single-click sign-in with Google reduces friction
- (+) Supabase handles token exchange and session management
- (+) No password storage or reset flow needed
- (-) Redirect URL must be registered in both Google Cloud Console and Supabase Dashboard
- (-) `redirectTo` must include `window.location.pathname` — using only `window.location.origin` causes React Router's root `<Navigate>` to strip the `?code=` PKCE callback parameter before Supabase can process it

---

## DEC-011: Route Hierarchy via Self-Referential FKs

**Date**: 2026-03-01
**Status**: Accepted

**Context**
Some routes are extensions or variants of base routes (e.g. N222 has segments and variants). A flat route model cannot express these relationships.

**Decision**
Add three nullable self-referential FK columns to the `routes` table: `is_segment_of`, `is_extension_of`, `is_variant_of` — all `uuid` references to `routes.id`. Routes with no parent FK are treated as root routes.

**Consequences**
- (+) Relationships are explicit and queryable in SQL
- (+) `rootRoutes` and `getChildren(id)` can be derived client-side via `useMemo`
- (+) Map can display child routes with dashed lines without a separate table
- (-) UI needs breadcrumb navigation and a `SubRouteSection` component to expose the hierarchy
- (-) Route list must filter to `rootRoutes` only to avoid showing duplicates

---

## DEC-012: i18n via Translations Table + i18next

**Date**: 2026-01-24
**Status**: Accepted

**Context**
MVP requires Portuguese and English. Options considered: columns per language (rigid), JSON fields (no SQL type safety), or a separate translations table (flexible).

**Decision**
Use a separate `translations` table keyed by `(entity_type, entity_id, language)` for content strings (names, descriptions). Use i18next with `i18next-browser-languagedetector` for UI strings stored in `locales/pt.json` and `locales/en.json`.

**Consequences**
- (+) Adding a third language requires only new rows in `translations`, no schema change
- (+) UI strings and content strings are clearly separated
- (-) Each data hook must call `fetchTranslations()` and merge results
- (-) Language detection order: `localStorage` key `language` → `navigator.language` fallback

---

## DEC-013: Landscape Type as PostgreSQL ENUM

**Date**: 2026-01-24
**Status**: Accepted

**Context**
Users want to filter routes and destinations by landscape type. The set of types is small and stable.

**Decision**
Define a PostgreSQL ENUM `landscape_type` with values: `mountain`, `coast`, `valley`, `plains`, `forest`, `mixed`, `urban`. Used on both `routes` and `destinations` tables.

**Consequences**
- (+) Database enforces valid values — no invalid strings possible
- (+) Easy to filter with a `WHERE landscape_type = $1` clause
- (-) Adding a new type requires an `ALTER TYPE` migration
- (-) Manual classification required in the Python import pipeline (`scripts/import_gpx.py`)

---

## DEC-014: Shared Mapbox instance via layout route (supersedes implicit Phase 3 decision)

**Date**: 2026-03-02
**Status**: Accepted (pending implementation — see `.planning/phases/11-shared-map/SPEC.md`)

**Context**
In Phase 3, a `RouteMap` component was created that initialises a `mapboxgl.Map` instance in a `useEffect([])` and destroys it with `map.remove()` on unmount. This pattern was repeated without review in Phase 5 (JourneyMap) and Phase 6 (DestinationMap).

Because React Router renders each page as an independent component, switching tabs causes the current page to unmount (destroying the map) and the new page to mount (creating a new map). This results in ~500ms of visible reload on every tab switch, and the camera position (zoom/pan) is lost between tabs.

This decision should have been made and documented in Phase 3, before JourneyMap and DestinationMap were ever created.

**Decision**
Refactor to a single persistent `mapboxgl.Map` instance held in a `MapContext`, initialised in a `SharedMap` component inside an `AppLayout` layout route. All sources and layers for all sections are added once on `map.on('load')` with `visibility: 'none'`. Each section shows/hides its own layers on mount/unmount via `showLayers()`/`hideLayers()` helpers in `mapLayers.ts`.

React Router v7 layout routes (`<Route element={<AppLayout />}>`) ensure `AppLayout` never unmounts during tab navigation, so the map instance persists for the full session.

**Rejected Alternatives**
- **Per-page Map components (current)**: Each section owns its `mapboxgl.Map`. Simple to implement per phase, but causes full map reload (~500ms) on every tab switch. Camera state lost. Not appropriate for a tab-based SPA.
- **CSS `display: none` toggle**: Hide/show map containers without unmounting. Avoids map reload but keeps all three Map component trees in memory simultaneously (~3x memory). Does not fix the architecture.
- **react-map-gl with `reuseMaps={true}`**: Valid library-based alternative, but introduces a dependency and wrapping layer around the raw Mapbox GL JS API. Given the direct Mapbox usage throughout the codebase, the shared context approach is more consistent.

**Consequences**
- (+) Tab switch latency: ~500ms → ~50ms
- (+) Camera position preserved when switching tabs and returning
- (+) Single LoginModal instance (currently duplicated in 3 places)
- (+) ~800 lines of code deleted (3 Map components + 3 Page components replaced by 3 leaner Section components)
- (-) Initial setup more complex: requires MapContext, SharedMap, AppLayout, layer visibility helpers
- (-) All layer `add*` functions in `mapLayers.ts` must default to `visibility: 'none'`
- (-) Event listeners must be registered/unregistered per section (not at map init time)
- (-) DestinationMap's click listener (currently inside `map.on('load')`) must be moved to a proper useEffect with cleanup

---

## DEC-015: Road Alternatives — Curatorial Combinations Architecture

**Date**: 2026-03-02
**Status**: Accepted (implemented silently during Phase 10, formalised 2026-03-02)

**Context**
Routes are individual GPX segments. A single road like N222 has multiple named combinations (base only, base + Mesão Frio, base + Margem Norte, all combined). Users want to select a curated "N222 + Mesão Frio" experience without knowing which raw route segments compose it.

**Decision**
Introduce a `road_alternatives` table linking roads to curated ordered sets of route segments (`alternative_segments`). Each alternative pre-calculates `distance_km`, `elevation_gain`, and `geometry_geojson` (via `ST_LineMerge`) so the frontend receives merged geometry without runtime joins. `created_by = NULL` means curator-defined; future support for user-created alternatives via UUID reference.

**Rejected Alternatives**
- Add more self-referential FKs on routes: Already used for is_extension_of / is_variant_of. Does not model "named combination" concept cleanly.
- Compute merged geometry at query time: Expensive with ST_LineMerge per request. Pre-calculation is correct.
- Frontend-side merging of GeoJSON: No PostGIS available client-side; coordinate arrays need explicit ordering logic.

**Consequences**
- (+) Frontend receives a single merged GeoJSON per alternative — no assembly required
- (+) Pre-calculated stats per alternative (distance, elevation) without runtime aggregation
- (+) `created_by` field enables future user-created alternatives without schema change
- (-) Stats must be recalculated when component routes change
- (-) Schema complexity: roads → road_alternatives → alternative_segments → routes (4-level join)

---

## DEC-016: Geographic Areas — 6-Level Navigable Hierarchy

**Date**: 2026-03-02
**Status**: Accepted (implemented silently during Phase 10, formalised 2026-03-02)

**Context**
`destinations` table supports 3 editorial regions. Users need structured geographic discovery: find routes in Gerês, Northern Portugal, or all of Portugal. A flat list of editorial destinations does not scale.

**Decision**
Add a `geographic_areas` table with a `geo_level` ENUM (continent, country, macro_region, historic_province, natural_park, district, municipality) and a self-referential `parent_id` for hierarchy traversal. Real polygon geometries (MultiPolygon, 4326) stored in PostGIS. Route-to-area assignment is automatic via `ST_Intersects` (RPC `populate_route_geographic_areas`), with an `is_auto` flag for manual overrides. `destinations` table is preserved for editorial highlights with hero images and descriptions.

**Rejected Alternatives**
- Extend `destinations` table: Would mix editorial curation with geographic hierarchy — different concerns, different update cadences.
- Tags/labels on routes: Flat, no hierarchy, no polygon boundaries on map.
- OSM-based dynamic query: Requires real-time Overpass API calls, adds latency and external dependency.

**Consequences**
- (+) Full hierarchy: breadcrumb navigation (Portugal > Norte > Gerês)
- (+) Automatic route assignment via ST_Intersects — no manual tagging needed
- (+) Map can show polygon boundaries when user filters by area
- (+) Portugal (CAOP 2024.1) and Spain (GADM 4.1) can be imported with existing Python pipeline pattern
- (-) Geographic data import is complex (CAOP, Overpass API, GADM — 3 sources)
- (-) Historic provinces require manual polygon aggregation from municipal boundaries
- (-) `destinations` and `geographic_areas` are parallel systems — must be kept consistent

---

## DEC-017: is_featured Flag + Highlight Notes per Route

**Date**: 2026-03-02
**Status**: Accepted (implemented during Phase 10)

**Context**
Some routes contain a standout segment that should be highlighted visually and textually. N103 runs Esposende→Chaves but the spectacular section is only Braga→Chaves. Users see the full 174km route but miss the key message: "the best part starts at Braga".

**Decision**
Add `is_featured BOOLEAN DEFAULT true` and `highlight_note_pt / highlight_note_en TEXT` columns to `routes`. Routes with `is_featured = false` are shown on the map but de-emphasised. `highlight_note` renders as an amber callout in `RouteDetails` sidebar. A POI of type `highlight_start` marks the exact start point on the map with a ⭐ emoji.

**Rejected Alternatives**
- Journey stages for sub-highlighting: Overkill for a single-road highlight. Journeys are multi-road compositions.
- Frontend-only computed highlighting: Would require hardcoded logic per route — not scalable.

**Consequences**
- (+) Editorial control per route without schema changes for new highlights
- (+) Bilingual support built-in (pt + en)
- (+) Visual callout in sidebar draws attention to the key message
- (+) POI type `highlight_start` integrates with existing POI layer on map
- (-) is_featured=false routes still appear in the list — UI must communicate "full route, but best part starts at X"

---

## DEC-018: GSD as execution layer

**Date**: 2026-03-02
**Status**: Accepted

**Context**
Long development sessions cause context rot: the main conversation accumulates state from all previous tasks, degrading planning quality. GSD v1.22.0 was already installed in `.claude/` with commands, agents, hooks, and workflows. The project had `docs/ROADMAP.md`, `docs/VISION.md`, `state.md`, and `docs/INDEX.md` — four files that partially overlapped with what GSD's `.planning/` directory provides.

**Decision**
Adopt GSD as the execution layer. `.planning/` (local only, not committed) handles phase tracking, execution state, and GSD context. `docs/` remains the permanent knowledge layer (DECISIONS, AUDIT, PATTERNS, phase specs). Redundant files (`docs/ROADMAP.md`, `docs/VISION.md`, `state.md`, `docs/INDEX.md`) are deleted; their content migrated to `.planning/`.

**Rejected Alternatives**
- Keep both systems in parallel: Creates two sources of truth for phase status — inevitable drift.
- Use GSD exclusively (delete `docs/`): `docs/DECISIONS.md`, `AUDIT.md`, `PATTERNS.md` are permanent architectural knowledge, not session state. They belong in version control.

**Consequences**
- (+) Phase tracking lives in `.planning/ROADMAP.md` — GSD reads it natively
- (+) `/gsd:plan-phase N` → `/gsd:execute-phase N` → `/gsd:verify-work` for complete phases
- (+) Context rot reduced: fresh agents per phase, not accumulated session state
- (+) `/status` skill writes to `.planning/STATE.md` (GSD-compatible)
- (-) `.planning/` is local only — team members must run `/status` to regenerate STATE.md
- (-) `docs/ROADMAP.md` no longer exists — references in older docs may be stale

---

## Template for New Decisions

```markdown
## DEC-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: Proposal | Accepted | Rejected | Superseded

**Context**
[What is the problem or need?]

**Decision**
[What was decided?]

**Rejected Alternatives**
- [Option A]: [Reason for rejection]
- [Option B]: [Reason for rejection]

**Consequences**
- (+) [Benefit]
- (-) [Cost or risk]
```
