# Plan: Shared Mapbox Instance via Layout Route

**Status:** Ready to implement
**Motivation:** Currently each section (Routes, Journeys, Destinations) mounts its own `mapboxgl.Map` instance. When the user switches tabs, the old map is destroyed and a new one is created (~500ms delay, camera state lost). Best practice in 2026 (React Router v7 + Mapbox GL JS) is a single persistent map instance shared via a layout route.

---

## Current Architecture (the problem)

```
App.tsx
└── <Routes> (flat)
    ├── /routes    → <RoutesPage>      → <RouteMap>      → new mapboxgl.Map() + map.remove()
    ├── /journeys  → <JourneysPage>    → <JourneyMap>    → new mapboxgl.Map() + map.remove()
    └── /destinations → <DestinationsPage> → <DestinationMap> → new mapboxgl.Map() + map.remove()
```

**Effect on tab switch:** React Router destroys the old page → `map.remove()` runs → new page mounts → `new mapboxgl.Map()` runs → ~500ms of blank/reload.

---

## Target Architecture

```
App.tsx
└── <Route element={<AppLayout />}>   ← layout route: persists, never unmounts
    ├── /routes       → <RoutesSection>       ← only sidebar/sheet content
    ├── /routes/:slug → <RoutesSection>
    ├── /journeys     → <JourneysSection>
    ├── /journeys/:slug → <JourneysSection>
    ├── /destinations → <DestinationsSection>
    └── /destinations/:slug → <DestinationsSection>

AppLayout renders:
  NavHeader (persists)
  SharedMap (ONE mapboxgl.Map instance, persists)
  <Outlet />  ← section content swaps here
  MobileTabBar (persists)
  LoginModal (single instance, persists)
```

**Effect on tab switch:** `<AppLayout>` never unmounts. Only `<Outlet>` content changes. SharedMap instance is never destroyed. Tab switch = ~50ms (just React re-render).

---

## Key Design Decisions

### 1. All sources/layers added at init (never recreated)
`SharedMap` adds ALL sources and layers from all three sections on `map.on('load')`. Layers are **hidden by default** (`visibility: 'none'`). Each section shows/hides its own layers on mount/unmount.

This avoids the complexity of dynamically adding/removing sources mid-session (which can cause "source already exists" errors and requires careful ordering).

### 2. Map instance shared via React Context
A `MapContext` provides `{ mapRef, mapReady }` to all children. Sections access it via `useMapContext()`.

### 3. Event listeners registered per-section, with cleanup
Each section (RoutesSection, JourneysSection, DestinationsSection) registers its own Mapbox event listeners in a `useEffect` and removes them in the cleanup function. Since the map persists, listeners from a previous section must be properly removed before the next section registers new ones.

### 4. LoginModal moved to AppLayout (single instance)
Currently rendered in 3 places (NavHeader, MobileTabBar, RoutesPage). Move to AppLayout with shared state via Context or props drilling through Outlet context.

### 5. ProfilePage excluded from layout route
`/profile` does not use a map. It can remain a flat route outside the layout, OR be inside the layout with the map hidden. Recommend: keep inside layout but hide map container with CSS.

---

## Files to Create

### `frontend/src/components/Map/SharedMap.tsx`
Single Mapbox instance. Responsibilities:
- Init `mapboxgl.Map` once on mount (never destroy)
- On `map.on('load')`: add ALL sources+layers from ALL sections (routes, journeys, destinations)
- All layers start with `visibility: 'none'`
- Store `mapRef` in `MapContext`
- Set `mapReady: true` when `map.on('load')` fires
- Handle resize when layout changes (sidebar appears/disappears)

```typescript
// Sketch of SharedMap.tsx
export function SharedMap({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const { setMapRef, setMapReady } = useMapContext()

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-7.9, 41.0],
      zoom: 7,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // Routes section
      addGeoBoundarySources(map)
      addGeoBoundaryLayers(map)      // visibility: 'none'
      addRouteSources(map, [])
      addRouteLayers(map)            // visibility: 'none'
      addSubRouteSources(map)
      addSubRouteLayers(map)         // visibility: 'none'
      addContextDimSources(map)
      addContextDimLayer(map)        // visibility: 'none'
      addPOISources(map)
      addPOILayers(map)              // visibility: 'none'

      // Journeys section
      addJourneySources(map)
      addJourneyLayers(map)          // visibility: 'none'

      // Destinations section
      addDestinationSources(map)
      addDestinationLayers(map)      // visibility: 'none'

      setMapRef(map)
      setMapReady(true)
    })

    // NOTE: no return cleanup with map.remove() — map persists for app lifetime
  }, [])

  return null  // container div is managed by AppLayout
}
```

**IMPORTANT:** `mapLayers.ts` must be updated to add `layout: { visibility: 'none' }` to all layer definitions. Each section will call `map.setLayoutProperty(layerId, 'visibility', 'visible')` on mount and `'none'` on unmount.

### `frontend/src/contexts/MapContext.tsx`
```typescript
interface MapContextValue {
  mapRef: React.MutableRefObject<mapboxgl.Map | null>
  mapReady: boolean
}

export const MapContext = createContext<MapContextValue>(...)
export function MapProvider({ children }: { children: React.ReactNode }) { ... }
export function useMapContext(): MapContextValue { ... }
```

### `frontend/src/components/AppShell/AppLayout.tsx`
Layout route component. Responsibilities:
- Renders NavHeader, map container div, MobileTabBar
- Mounts SharedMap inside the map container
- Wraps everything in MapProvider
- Renders `<Outlet />` for section content
- Manages single LoginModal instance (move from NavHeader + MobileTabBar)
- Passes login modal opener via OutletContext

```typescript
// Sketch of AppLayout.tsx
export function AppLayout() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <MapProvider>
      <div className="flex flex-col h-screen">
        <NavHeader onLoginOpen={() => setLoginOpen(true)} />

        <div className="flex-1 relative overflow-hidden">
          {/* Map container — always mounted, never destroyed */}
          <div ref={mapContainerRef} className="absolute inset-0" />
          <SharedMap containerRef={mapContainerRef} />

          {/* Section content (sidebar, bottom sheet) overlays the map */}
          <Outlet context={{ openLogin: () => setLoginOpen(true) }} />
        </div>

        <MobileTabBar onLoginOpen={() => setLoginOpen(true)} />
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    </MapProvider>
  )
}
```

### `frontend/src/sections/RoutesSection.tsx` (renamed from `pages/RoutesPage.tsx`)
Receives `mapRef` from `useMapContext()` instead of rendering `<RouteMap>`. Responsibilities:
- All existing state and hooks (unchanged)
- On mount: show route layers, register event listeners
- On unmount: hide route layers, remove event listeners, clear data sources
- Sidebar + bottom sheet UI (unchanged)

### `frontend/src/sections/JourneysSection.tsx` (renamed from `pages/JourneysPage.tsx`)
Same pattern as RoutesSection for journey layers.

### `frontend/src/sections/DestinationsSection.tsx` (renamed from `pages/DestinationsPage.tsx`)
Same pattern as RoutesSection for destination layers.

---

## Files to Modify

### `frontend/src/App.tsx`
Change from flat routes to nested layout route:

```typescript
// BEFORE
<Routes>
  <Route path="/" element={<Navigate to="/routes" replace />} />
  <Route path="/routes" element={<RoutesPage />} />
  <Route path="/routes/:slug" element={<RoutesPage />} />
  <Route path="/journeys" element={<JourneysPage />} />
  <Route path="/journeys/:slug" element={<JourneysPage />} />
  <Route path="/destinations" element={<DestinationsPage />} />
  <Route path="/destinations/:slug" element={<DestinationsPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Routes>

// AFTER
<Routes>
  <Route path="/" element={<Navigate to="/routes" replace />} />
  <Route element={<AppLayout />}>
    <Route path="/routes" element={<RoutesSection />} />
    <Route path="/routes/:slug" element={<RoutesSection />} />
    <Route path="/journeys" element={<JourneysSection />} />
    <Route path="/journeys/:slug" element={<JourneysSection />} />
    <Route path="/destinations" element={<DestinationsSection />} />
    <Route path="/destinations/:slug" element={<DestinationsSection />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

### `frontend/src/components/Map/mapLayers.ts`
Add `layout: { visibility: 'none' }` as default to ALL layer definitions (routes, journeys, destinations). Export layer visibility helpers:

```typescript
// New exports needed
export const ROUTE_LAYERS = [LAYER_BASE, LAYER_HOVER, LAYER_SELECTED, ...]
export const JOURNEY_LAYERS = [LAYER_JOURNEY_STAGES, LAYER_JOURNEY_STAGE_HOVER, LAYER_JOURNEY_SELECTED]
export const DESTINATION_LAYERS = [LAYER_DESTINATION_FILL, LAYER_DESTINATION_OUTLINE, LAYER_DESTINATION_ROUTES]
export const GEOBOUNDARY_LAYERS = [LAYER_GEO_BOUNDARY_FILL, LAYER_GEO_BOUNDARY_OUTLINE]
export const POI_LAYERS = [LAYER_POI_CIRCLES, LAYER_POI_LABELS]
export const CONTEXT_LAYERS = [LAYER_CONTEXT_DIM, LAYER_SUB_ROUTES]

export function showLayers(map: MapboxMap, layers: string[]) {
  layers.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible')
  })
}

export function hideLayers(map: MapboxMap, layers: string[]) {
  layers.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
  })
}
```

### `frontend/src/components/AppShell/NavHeader.tsx`
Remove LoginModal rendering. Instead, accept `onLoginOpen: () => void` prop.

### `frontend/src/components/AppShell/MobileTabBar.tsx`
Remove LoginModal rendering. Instead, accept `onLoginOpen: () => void` prop.

### `frontend/src/pages/ProfilePage.tsx`
No map. On mount, hide all map layers (or AppLayout detects `/profile` and hides map container). Simplest approach: AppLayout checks `pathname` and applies `display: none` or opacity to map container.

---

## Implementation Steps (Ordered)

### Step 1: Create `MapContext.tsx`
Simple context with `mapRef` + `mapReady`. No logic. ~30 lines.

### Step 2: Update `mapLayers.ts`
- Add `layout: { visibility: 'none' }` to all layer `addXxx` functions
- Export layer ID arrays (`ROUTE_LAYERS`, `JOURNEY_LAYERS`, etc.)
- Export `showLayers()` and `hideLayers()` helpers

**Risk:** High. This changes all layer initialization. Must verify all 3 Map components still work before continuing.

### Step 3: Create `SharedMap.tsx`
- Copy init logic from RouteMap (most complete)
- Add journey and destination sources/layers after route layers
- All layers start hidden
- No `map.remove()` on cleanup
- Stores map in context

### Step 4: Create `AppLayout.tsx`
- Layout shell with NavHeader + map container div + Outlet + MobileTabBar
- LoginModal with single `loginOpen` state
- NavHeader and MobileTabBar receive `onLoginOpen` prop instead of managing modal themselves

### Step 5: Refactor `NavHeader.tsx` and `MobileTabBar.tsx`
- Remove LoginModal instances
- Accept `onLoginOpen` prop

### Step 6: Create `RoutesSection.tsx`
Transform RoutesPage to not render RouteMap. Instead:
- Get `{ mapRef, mapReady }` from `useMapContext()`
- On mount: `showLayers(map, [...ROUTE_LAYERS, ...GEOBOUNDARY_LAYERS, ...POI_LAYERS, ...CONTEXT_LAYERS])`
- On unmount: `hideLayers(map, [...ROUTE_LAYERS, ...GEOBOUNDARY_LAYERS, ...POI_LAYERS, ...CONTEXT_LAYERS])`
- Register event listeners (click, hover on LAYER_BASE + LAYER_POI_CIRCLES) in useEffect with cleanup
- Data sync useEffects (routes, pois, subRoutes, contextSegments, geoBoundary) remain same, but use `mapRef.current` from context
- Keep RouteAnimation component (it only needs `mapRef` and `animating` state)
- Sidebar + mobile bottom sheet UI: unchanged

### Step 7: Create `JourneysSection.tsx`
Same pattern:
- `showLayers(map, JOURNEY_LAYERS)` on mount
- `hideLayers(map, JOURNEY_LAYERS)` on unmount
- Register click/hover on `LAYER_JOURNEY_STAGES` with cleanup
- Data sync for stages + selectedStage

### Step 8: Create `DestinationsSection.tsx`
Same pattern:
- `showLayers(map, DESTINATION_LAYERS)` on mount
- `hideLayers(map, DESTINATION_LAYERS)` on unmount
- Register click on map (deselect when no feature) with cleanup
- Data sync for destinations + selectedDestination + featuredRoutes

### Step 9: Update `App.tsx`
Wrap sections in `<Route element={<AppLayout />}>`.

### Step 10: Handle `/profile` route
Options (pick one):
- **Option A:** In AppLayout, detect `pathname === '/profile'` and apply `pointer-events-none opacity-0` to map container. Map persists but is invisible.
- **Option B:** ProfilePage calls `hideLayers(map, [...ALL_LAYERS])` on mount.
- **Option C:** `/profile` is a flat route outside the layout (AppLayout not used). Simpler but profile loses NavHeader/MobileTabBar consistency.

**Recommended: Option A** — simplest, no special logic in ProfilePage.

### Step 11: Remove old Map components
Once all sections are working:
- Delete `RouteMap.tsx`
- Delete `JourneyMap.tsx`
- Delete `DestinationMap.tsx`
- Delete `pages/RoutesPage.tsx`, `pages/JourneysPage.tsx`, `pages/DestinationsPage.tsx`
- Keep `RouteAnimation.tsx` (still needed by RoutesSection + JourneysSection)

### Step 12: Verify & test
- Desktop: switch between Routes/Journeys/Destinations — map must NOT reload
- Mobile: switch tabs — map camera position must persist between tabs
- URL slugs: `/routes/n222` still pre-selects correctly
- Favorites, history, auth: unchanged
- ProfilePage: map hidden or not visible
- fitBounds: still works per section (triggered by data sync effects)
- Animations: RouteAnimation still works

---

## Gotchas & Risks

### Layer ordering (CRITICAL)
Mapbox GL renders layers in the order they were added. The current order per section is carefully tuned. In SharedMap, the combined order must be:

```
1. GeoBoundary (fill, outline)          ← Routes section
2. Context dim segments                 ← Routes section
3. Sub-routes                           ← Routes section
4. Routes base                          ← Routes section
5. Routes hover                         ← Routes section
6. Routes selected (animated)          ← Routes section
7. POI circles                          ← Routes section
8. POI labels                           ← Routes section
9. Journey stages                       ← Journeys section
10. Journey stage hover                 ← Journeys section
11. Journey selected (animated)        ← Journeys section
12. Destination fill                    ← Destinations section
13. Destination outline                 ← Destinations section
14. Destination routes                  ← Destinations section
```

This is fine because layers from different sections don't overlap visually (they're hidden when not in use).

### DestinationMap click listener registered in `map.on('load')` (not in useEffect)
Currently, the deselect click listener is registered inside `map.on('load')` callback (not in a separate useEffect). This must be moved to a proper `useEffect` in DestinationsSection with cleanup, so it's only active when the Destinations section is mounted.

### `popupRef` in RoutesSection
The Mapbox Popup (for POI clicks) is currently local to RouteMap. It must be a `useRef` in RoutesSection (or SharedMap) and cleaned up on section unmount.

### `mapboxgl.accessToken` set once
Currently set in each Map component init. In SharedMap it's set once. Remove from old components (already deleted in Step 11).

### `setMapInstance` / `mapInstance` state
Some effects in the old Map components use a local `mapInstance` state to force re-runs. In Sections, use `mapReady` from context + `mapRef.current` directly. Remove `mapInstance` state entirely.

### `RouteAnimation.tsx` depends on `mapRef`
Currently receives `mapRef` as a prop. RoutesSection and JourneysSection will pass their `mapRef` (from context) to `RouteAnimation`. No change needed to `RouteAnimation.tsx` itself.

### `fitBounds` padding with sidebar
The sidebar (w-80 = 320px) creates left padding for `fitBounds` on desktop. This logic is currently inside each Map component. In Sections, it stays the same — the section knows if it's desktop (`!isMobile`) and applies the correct padding.

### LoginModal state consolidation
Currently `loginOpen` state exists in 3 places. Move to `AppLayout`. Pass `onLoginOpen` callback to NavHeader and MobileTabBar via props. Pass to sections via `useOutletContext<{ openLogin: () => void }>()` (needed by RoutesSection for the FavoriteButton login prompt).

---

## File Summary

| Action | File | Notes |
|--------|------|-------|
| CREATE | `src/contexts/MapContext.tsx` | mapRef + mapReady context |
| CREATE | `src/components/Map/SharedMap.tsx` | Single mapboxgl.Map instance |
| CREATE | `src/components/AppShell/AppLayout.tsx` | Layout route with Outlet |
| CREATE | `src/sections/RoutesSection.tsx` | Routes UI + map integration |
| CREATE | `src/sections/JourneysSection.tsx` | Journeys UI + map integration |
| CREATE | `src/sections/DestinationsSection.tsx` | Destinations UI + map integration |
| MODIFY | `src/components/Map/mapLayers.ts` | Add visibility:none, export helpers |
| MODIFY | `src/App.tsx` | Nested routes with AppLayout |
| MODIFY | `src/components/AppShell/NavHeader.tsx` | Remove LoginModal, add onLoginOpen prop |
| MODIFY | `src/components/AppShell/MobileTabBar.tsx` | Remove LoginModal, add onLoginOpen prop |
| DELETE | `src/components/Map/RouteMap.tsx` | Replaced by SharedMap + RoutesSection |
| DELETE | `src/components/Map/JourneyMap.tsx` | Replaced by SharedMap + JourneysSection |
| DELETE | `src/components/Map/DestinationMap.tsx` | Replaced by SharedMap + DestinationsSection |
| DELETE | `src/pages/RoutesPage.tsx` | Replaced by RoutesSection |
| DELETE | `src/pages/JourneysPage.tsx` | Replaced by JourneysSection |
| DELETE | `src/pages/DestinationsPage.tsx` | Replaced by DestinationsSection |
| KEEP | `src/components/Map/RouteAnimation.tsx` | Unchanged |
| KEEP | `src/components/Map/mapLayers.ts` | Modified only |
| KEEP | `src/pages/ProfilePage.tsx` | No changes needed |

**Estimated scope:** ~600 lines new/modified, ~800 lines deleted (net reduction).

---

## Expected Result

| Metric | Before | After |
|--------|--------|-------|
| Tab switch latency | ~500ms | ~50ms |
| mapboxgl.Map instances | 3 (recreated) | 1 (persistent) |
| Map camera on tab switch | Reset to Portugal | Preserved |
| LoginModal instances | 3 | 1 |
| Memory (map) | 50+ MB (peaks) | ~20 MB (stable) |
