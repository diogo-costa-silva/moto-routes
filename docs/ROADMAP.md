# Roadmap

> Implementation phases from zero to deployed MVP.

---

## Overview

| Phase | Name | Focus |
|-------|------|-------|
| 0 | Preparation | Documentation, tooling ✓ |
| 1 | Foundation | Supabase, Vite, Tailwind ✓ |
| 2 | Data Pipeline | Import GPX, create test data ✓ |
| 3 | Routes | Map visualization with animations ✓ |
| 4 | POIs | Points of interest ✓ |
| 5 | Journeys | Multi-stage trips |
| 6 | Destinations | Geographic regions |
| 7 | Users | Authentication, favorites, history |
| 8 | i18n | Portuguese + English |
| 9 | Filters | Landscape type tags |
| 10 | Deploy | Polish and launch |

---

## Phase 0: Preparation ✓ COMPLETE

**Objective**: Project structure and tooling ready.

### Completed
- [x] Folder structure created
- [x] Documentation (MVP.md, CLAUDE.md, etc.)
- [x] GPX files copied to `data/`
- [x] Claude Code skills (8) and subagents (13)
- [x] Git initialized

---

## Phase 1: Foundation ✓ COMPLETE

**Objective**: Project configured, database ready with complete schema.

### Tasks
- [x] Create Supabase project (eu-west-1 region)
- [x] Execute schema.sql in Supabase SQL Editor
- [x] Initialize frontend with Vite + React + TypeScript
- [x] Configure Tailwind CSS
- [x] Create .env files with credentials (Supabase URL, Key, Mapbox token)
- [x] Test Supabase connection from frontend
- [x] Define error handling pattern (error boundaries, toast notifications)

### Database Tables
- `roads` (abstract road reference, optional)
- `routes` (with `landscape_type` field)
- `journeys`, `journey_stages`
- `destinations`, `destination_featured_routes`
- `pois` (with `association_type`, `distance_meters`)
- `route_pois` (with `km_marker`)
- `users` (Supabase Auth)
- `user_favorites`, `user_history`
- `translations`

### Validation Criteria
- [x] `npm run dev` starts without errors
- [x] Database has all tables created
- [x] Frontend connects to Supabase

---

## Phase 2: Data Pipeline ✓ COMPLETE

**Objective**: Test data in the database with complete metadata.

### Tasks
- [x] Create Python import script `scripts/import_gpx.py` (< 500 LOC) — 390 LOC final
  - Parse GPX with gpxpy library
  - Extract geometry (convert to PostGIS format)
  - Calculate metrics: distance_km, elevation_gain, elevation_loss
  - Count curves (gentle/moderate/sharp based on bearing changes)
  - **Classify landscape_type** for each route
  - Validate coordinate order is (longitude, latitude)
- [x] Import 7 GPX routes with landscape_type:
  - `pt-n222.gpx` → N222, landscape: `river_valley`
  - `pt-n222-var-margem-norte.gpx` → N222 Variant, landscape: `river_valley`
  - `pt-n222-ext-mesao-frio.gpx` → N222 Extension, landscape: `mountain`
  - `pt-n222-ext-pias.gpx` → N222 Extension, landscape: `mountain`
  - `pt-n2.gpx` → N2, landscape: `mixed`
  - `pt-n304-alvao.gpx` → EN304, landscape: `mountain`
  - `es-figueres-cadaques.gpx` → Figueres-Cadaqués, landscape: `coast`
- [x] Create 1-2 test journeys with stages — 2 journeys criados
- [x] Create 2-3 test destinations with bounding boxes — 3 destinations criadas
- [x] Create 5-10 test POIs with association_type (on_route/near_route/detour) — 5 POIs criados
- [x] Populate translations table (PT + EN) for routes, journeys, destinations — 48 translations

### Validation Criteria
- [x] `SELECT COUNT(*) FROM routes;` → 7
- [x] `SELECT COUNT(*) FROM routes WHERE landscape_type IS NOT NULL;` → 7
- [x] `SELECT COUNT(*) FROM journeys;` → 2
- [x] `SELECT COUNT(*) FROM destinations;` → 3
- [x] `SELECT COUNT(*) FROM pois;` → 5
- [x] `SELECT COUNT(*) FROM translations;` → 48

---

## Phase 3: Frontend - Routes ✓ COMPLETE

**Objective**: Route visualization with smooth animations.

### Components
- `RouteMap.tsx` - Main map with 3-layer strategy (base/hover/selected)
- `RouteAnimation.tsx` - line-dasharray RAF animation (1.8s)
- `RouteList.tsx` - Skeleton loading, hover/selection state
- `RouteDetails.tsx` - Desktop sidebar + mobile bottom sheet, GPX download
- `useRoutes.ts` - Supabase fetch hook with RouteGeoJSON type guard
- `pages/RoutesPage.tsx` - Responsive layout orchestrator

### Features
1. Mapbox map with routes displayed
2. **Drawing animation** - line appears point by point
3. **Fly-to** - smooth transition when selecting route (1.5s)
4. **Hover highlight** - visual feedback on hover
5. **Bottom sheet** - mobile-friendly detail panel (50% height)
6. GPX download button

### Validation Criteria
- [x] **Desktop**: Click route → fly-to animation (1.5s) → sidebar appears with details
- [x] **Mobile**: Click route → fly-to animation → bottom sheet slides up (50% height)
- [x] **Hover**: Route highlights on map when hovering list item
- [x] **Animation**: Line drawing animation completes in < 2s
- [x] **Download**: GPX file downloads, imports to Strava without errors
- [x] **Responsive**: Works on 375px (iPhone) to 1920px (desktop)
- [x] **Performance**: Initial map render with 7 routes < 2s

---

## Phase 4: Frontend - POIs ✓ COMPLETE

**Objective**: Points of interest on routes.

### Components
- `POIList.tsx` - POI list component with type emoji, association badge, km marker
- `RouteDetails.tsx` (updated) - Optional POIs section
- `RouteMap.tsx` (updated) - poi-circles + poi-labels layers, mapboxgl.Popup
- `useRoutePOIs.ts` - RPC hook for POI data with coordinates
- `get_pois_for_route` SQL RPC - PostGIS ST_X/ST_Y to extract lon/lat

Note: `POIMarkers.tsx` and `POIPopup.tsx` were not created as separate components — popup logic was integrated directly into `RouteMap.tsx` using `mapboxgl.Popup` inline.

### Features
1. Map markers with type-specific icons
2. "Points of Interest" section in route details
3. Popup on click (name, description, association type)
4. Visual distinction: `on_route` vs `near_route` vs `detour`

### POI Types
- viewpoint
- restaurant
- fuel_station
- waterfall
- village
- historical_site

### Validation Criteria
- [x] Markers visible on map when a route with POIs is selected (N222 has 3, N304 has 2)
- [x] Click marker → popup appears with name, type emoji, association badge, description
- [x] "Points of Interest" section in sidebar/bottom sheet
- [x] Routes without POIs: no markers, section hidden

---

## Phase 5: Frontend - Journeys (IN PROGRESS)

**Objective**: Multi-stage trip visualization.

### Components
- `JourneyMap.tsx` - Journey map view ✓
- `JourneyDetails.tsx` - Journey details + stage list ✓ (note: JourneyStages merged into JourneyDetails)
- `JourneyList.tsx` - Journey selection list ✓
- `useJourneys.ts` - Data fetching hook ✓
- `MobileTabBar.tsx` - Mobile navigation ✓

### Features
1. View all stages on map (different colors) ✓
2. Clickable stage list ✓
3. Click stage → animate that route ✓
4. Aggregated details (total distance, suggested days) ✓
5. GPX download per stage ✓
6. GPX download merged — **NOT YET IMPLEMENTED**

### Technical Notes
**Merge GPX Strategy** (for remaining criterion):
- Option A: PostGIS `ST_LineMerge` to combine geometries server-side
- Option B: Frontend concatenates trackpoints from each stage
- Output must be valid GPX with proper metadata (name, description, timestamps)

### Validation Criteria
- [x] View journey with all stages (different colors per stage)
- [x] Click stage → that route animates
- [x] Download per-stage: Individual GPX files work
- [ ] Download merged: Single GPX with all stages, imports to Strava

---

## Phase 6: Frontend - Destinations

**Objective**: Discovery by geographic region.

### Components
- `DestinationPage.tsx` - Region page
- `DestinationMap.tsx` - Focused map
- `DestinationRoutes.tsx` - Routes in region
- `RegionFilter.tsx` - Region dropdown

### Features
1. `/destinos/[slug]` route
2. Map focused on region with bounding box
3. Routes list filtered by region
4. Region filter dropdown on main map

### Validation Criteria
- [ ] `/destinos/douro` shows Douro routes
- [ ] Region area highlighted on map

---

## Phase 7: Frontend - Users

**Objective**: Authentication and user features.

### Components
- `auth.ts` - Auth service
- `useAuth.ts` - Auth hook
- `useFavorites.ts` - Favorites hook
- `useHistory.ts` - History hook
- `LoginModal.tsx` - Login UI
- `FavoriteButton.tsx` - Heart button
- `UserMenu.tsx` - User dropdown

### Features
1. Login/Signup (email or Google OAuth)
2. Favorite button on each route (heart)
3. "My Favorite Routes" list
4. Viewing history
5. User menu (profile, logout)

### Validation Criteria
- [ ] Login works (email + Google)
- [ ] Favorites persist across sessions
- [ ] History shows recently viewed routes

---

## Phase 8: Multilingual (PT/EN)

**Objective**: Interface in two languages.

### Components
- `i18n/index.ts` - i18n setup
- `locales/pt.json` - Portuguese translations
- `locales/en.json` - English translations
- `LanguageSwitcher.tsx` - Language toggle

### Features
1. UI translations (buttons, labels, messages)
2. Content translations (route names, descriptions)
3. Language switcher in header
4. Preference persistence

### Validation Criteria
- [ ] Switch language → all UI updates
- [ ] Content also updates (route names)
- [ ] Preference remembered on reload

---

## Phase 9: Landscape Tags

**Objective**: Filter by landscape type.

### Components
- `LandscapeFilter.tsx` - Filter component
- Update `useRoutes.ts` - Add filter logic

### Landscape Types
| Type | Label (PT) | Label (EN) |
|------|------------|------------|
| coast | Costa/Litoral | Coastal |
| mountain | Serra/Montanha | Mountain |
| forest | Floresta | Forest |
| urban | Urbano | Urban |
| river_valley | Vale/Rio | River Valley |
| mixed | Misto | Mixed |
| plains | Planície | Plains |

### Features
1. Visual tags on routes (colored badges)
2. Multi-select filter
3. Type-specific icons

### Validation Criteria
- [ ] Filter by "mountain" → only mountain routes shown
- [ ] Tags visible on route cards

---

## Phase 10: Polish & Deploy

**Objective**: Public MVP launch.

### Tasks
- [ ] Loading states with skeleton screens
- [ ] Empty states (no routes in region, etc.)
- [ ] Friendly error messages (user-facing, not technical)
- [ ] Navigation between sections
- [ ] Production build (`npm run build` succeeds)
- [ ] Vercel deployment
- [ ] Environment variables configured in Vercel
- [ ] Test auth in production
- [ ] Add basic test suite (critical paths)
- [ ] Accessibility check (keyboard navigation, sufficient contrast)

### Validation Criteria
- [ ] Public URL works (https://moto-routes.vercel.app or custom domain)
- [ ] All features work on mobile (iOS Safari 14+, Android Chrome 90+)
- [ ] No console errors in production
- [ ] Performance: First Contentful Paint < 3s on mobile 4G
- [ ] Basic accessibility: Tab navigation works, contrast ratio >= 4.5:1

---

## Dependencies

```
Phase 0 (done)
    ↓
Phase 1 (Foundation) ─── schema, Vite, Tailwind
    ↓
Phase 2 (Data) ─── routes, journeys, destinations, POIs, translations
    │
    ├──→ Phase 3 (Routes) ─── needs routes data
    │         ↓
    ├──→ Phase 4 (POIs) ─── needs POIs data
    │         ↓
    ├──→ Phase 5 (Journeys) ─── needs journeys + routes
    │         ↓
    ├──→ Phase 6 (Destinations) ─── needs destinations + routes
    │         ↓
    └──→ Phase 7 (Users) ─── can run parallel after Phase 2
              ↓
         Phase 8 (i18n) ─── needs translations from Phase 2
              ↓
         Phase 9 (Filters) ─── needs landscape_type from Phase 2
              ↓
         Phase 10 (Deploy)
```

### Key Dependencies
- **Phase 2 → Phases 3-7**: All frontend features need data
- **Phase 2 → Phase 8**: i18n needs translations populated
- **Phase 2 → Phase 9**: Filters need landscape_type classified
- **Phase 3 → Phases 5,6**: Journeys and Destinations reuse route components

---

## Final MVP Verification Checklist

> Complete checklist to validate MVP is ready for launch.

### Core Features

- [ ] **Homepage**: Map displays all routes
- [ ] **Region filter**: Dropdown filters routes by region
- [ ] **Select route**: Animation draws line, details appear
- [ ] **View POIs**: Markers visible, popup works (shows type: on_route/near_route/detour)
- [ ] **Download GPX**: File downloads, valid in Strava
- [ ] **View Journey**: Colored stages, navigation works
- [ ] **Destination page**: `/destinos/douro` loads correctly

### User Features

- [ ] **Login**: Email/password or Google OAuth works
- [ ] **Favorites**: Save route → appears in "My Favorites"
- [ ] **History**: Viewed routes appear in chronological order

### Extra Features

- [ ] **Multilingual**: Switch PT ↔ EN → UI and content update
- [ ] **Landscape filter**: Filter by "mountain" → only mountain routes shown
- [ ] **Mobile**: Everything works with bottom sheet

---

## Related Documents

- [Progress](../PROGRESS.md) - Current status
- [Architecture](./ARCHITECTURE.md) - System design
- [Schema](./SCHEMA.md) - Database structure
