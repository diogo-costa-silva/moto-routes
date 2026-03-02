# Architectural Audit — Moto Routes v4

**Date**: 2026-03-02
**Status**: Open issues — not yet fixed
**How to use**: Read this before starting any refactor. Do not introduce new instances of patterns flagged here. When an issue is resolved, mark it as ✅ and add the fix date.

---

## Summary

| ID | Area | Severity | Status | Affects |
|----|------|----------|--------|---------|
| A-01 | Mapbox: 3 separate map instances | 🔴 Critical | Open | All sections |
| A-02 | useAuth: N duplicate subscriptions | 🔴 Critical | Open | All pages + hooks |
| A-03 | LoginModal: 3 independent instances | 🟠 High | Open | NavHeader, MobileTabBar |
| A-04 | fetchTranslations: no cache, re-fetched per hook | 🟠 High | Open | useRoutes, useJourneys, useDestinations |
| A-05 | No data cache: re-fetched on every tab switch | 🟠 High | Open | All data hooks |
| A-06 | generateGpx: duplicated in 2 components | 🟠 High | Open | RouteDetails, JourneyDetails |
| A-07 | Mobile bottom sheet wrapper: duplicated 3× | 🟡 Medium | Open | RouteDetails, JourneyDetails, DestinationDetails |
| A-08 | useHistory.recordView: setState on unmounted component | 🟡 Medium | Open | useHistory |
| A-09 | useFavorites: optimistic update non-atomic | 🟡 Medium | Open | useFavorites |
| A-10 | RouteDetails: 13 props + mixed responsibilities | 🟡 Medium | Open | RouteDetails |
| A-11 | Skeleton loading components: duplicated 6× | 🟢 Low | Open | List components |
| A-12 | Sheet snap points: inconsistent values across files | 🟢 Low | Open | Pages + Detail components |
| A-13 | Back/close button SVG: duplicated 3× | 🟢 Low | Open | Detail components |

---

## A-01 — Mapbox: 3 separate map instances in a tab-based SPA

**Severity**: 🔴 Critical
**Decision**: DEC-014 in `docs/DECISIONS.md`
**Fix plan**: `docs/PLAN_SHARED_MAP.md` (Phase 11 in ROADMAP)

**Problem**: `RouteMap`, `JourneyMap`, and `DestinationMap` each create `new mapboxgl.Map()` in a `useEffect([])` and destroy it with `map.remove()` on unmount. Because React Router renders each page independently, switching tabs destroys the old map and creates a new one — ~500ms visible reload, camera state lost.

**Affected files**:
- `frontend/src/components/Map/RouteMap.tsx`
- `frontend/src/components/Map/JourneyMap.tsx`
- `frontend/src/components/Map/DestinationMap.tsx`

**Pattern to avoid going forward**: Never create a `new mapboxgl.Map()` inside a component that can unmount during tab navigation. Use a layout route + shared context.

---

## A-02 — useAuth: N duplicate Supabase subscriptions

**Severity**: 🔴 Critical

**Problem**: `useAuth()` creates an `onAuthStateChange` subscription inside a `useEffect`. It is called independently in:
- `RoutesPage.tsx:31`
- `NavHeader.tsx:12`
- `MobileTabBar.tsx:11`
- `useFavorites.ts:20` (called inside useFavorites which is called from RoutesPage)
- `useHistory.ts:35` (same)
- `ProfilePage.tsx:73`

This results in 5+ simultaneous subscriptions to the same Supabase auth event. React hooks are not singletons — each call to `useAuth()` creates independent state and a separate subscription.

**Impact now**: Functional but wasteful. Each auth state change triggers updates in 5 components redundantly.

**Impact when app grows**: Every new component or hook that uses auth adds another subscription. Exponential overhead.

**Fix**: Create an `AuthProvider` at the app root (in `App.tsx` or `main.tsx`). One `useEffect`, one `onAuthStateChange`, one `subscription.unsubscribe()`. All components read from context via `useAuth()` which becomes a thin wrapper around `useContext(AuthContext)`.

**Affected files**:
- `frontend/src/hooks/useAuth.ts` (core fix)
- `frontend/src/hooks/useFavorites.ts` (remove internal useAuth call)
- `frontend/src/hooks/useHistory.ts` (remove internal useAuth call)
- All callers (NavHeader, MobileTabBar, RoutesPage, ProfilePage)

---

## A-03 — LoginModal: 3 independent instances

**Severity**: 🟠 High

**Problem**: `LoginModal` is rendered in 3 separate places, each with its own `useState(false)`:
- `NavHeader.tsx:77` (desktop)
- `MobileTabBar.tsx:114` (mobile)
- `RoutesPage.tsx` (for auth-required actions like favorites)

Each instance has independent open/close state. Three DOM nodes for the same modal.

**Fix**: Move to `AppLayout` (created as part of Phase 11). Pass `onLoginOpen` as a prop to NavHeader and MobileTabBar, and via `useOutletContext` to sections. One modal, one state.

**Affected files**:
- `frontend/src/components/AppShell/NavHeader.tsx`
- `frontend/src/components/AppShell/MobileTabBar.tsx`
- `frontend/src/pages/RoutesPage.tsx`

---

## A-04 — fetchTranslations: no cache, re-fetched per hook

**Severity**: 🟠 High

**Problem**: `fetchTranslations(entityType, lang)` in `frontend/src/lib/translations.ts` has no caching. It is called independently by:
- `useRoutes.ts:88` → fetches `translations/routes`
- `useJourneys.ts:68` → fetches `translations/journeys`
- `useJourneys.ts:111` → fetches `translations/routes` again (when loading stage routes)
- `useDestinations.ts:65` → fetches `translations/destinations`
- `useDestinations.ts:118` → fetches `translations/routes` a third time

When a user navigates Routes → Journeys → Destinations, `translations/routes` is fetched 3 separate times. Changing language triggers a full re-fetch of all translations.

**Fix**: Add a module-level `Map` cache in `translations.ts`. Cache key: `${entityType}:${lang}`. Invalidate on language change.

```typescript
// Simple fix in translations.ts
const cache = new Map<string, Map<string, Record<string, string>>>()

export async function fetchTranslations(entityType: string, lang: string) {
  const key = `${entityType}:${lang}`
  if (cache.has(key)) return cache.get(key)!
  const result = await /* existing fetch logic */
  cache.set(key, result)
  return result
}
```

**Affected files**:
- `frontend/src/lib/translations.ts` (core fix, simple)

---

## A-05 — No data cache: all data re-fetched on every tab switch

**Severity**: 🟠 High

**Problem**: No cache layer exists. Each hook (`useRoutes`, `useJourneys`, `useDestinations`) fetches from Supabase on component mount. With the current architecture (3 separate page components), switching tabs causes full re-fetch every time. Switching language triggers another full re-fetch of everything.

This is compounded by A-01 (map reload) and will worsen when the dataset grows.

**Fix options** (in order of effort):
1. **Short term**: Keep data in module-level cache per language (same pattern as A-04 fix). Stale-while-revalidate manually.
2. **Medium term**: Migrate to React Query or SWR. Provides automatic caching, deduplication, background refetch, and stale time control.

**Note**: Partially mitigated by the Phase 11 refactor (A-01 fix), which keeps page components mounted longer, reducing mount-triggered fetches.

**Affected files**:
- `frontend/src/hooks/useRoutes.ts`
- `frontend/src/hooks/useJourneys.ts`
- `frontend/src/hooks/useDestinations.ts`

---

## A-06 — generateGpx: duplicated in 2 components

**Severity**: 🟠 High

**Problem**: The GPX generation and download logic is copy-pasted in two places with ~80% identical code:
- `frontend/src/components/Routes/RouteDetails.tsx:25-50` — `generateGpx(route)` + `downloadGpx(route)`
- `frontend/src/components/Journeys/JourneyDetails.tsx:18-67` — `generateGpx(name, slug, geometry)` + `generateMergedGpx(stages)`

The blob creation, URL object, anchor click, and URL revocation are identical in both files.

**Fix**: Extract to `frontend/src/lib/gpx.ts`:
```typescript
export function buildGpxTrack(name: string, coordinates: [number, number][]): string { ... }
export function downloadGpxFile(filename: string, content: string): void { ... }
```

**Affected files**:
- `frontend/src/components/Routes/RouteDetails.tsx`
- `frontend/src/components/Journeys/JourneyDetails.tsx`

---

## A-07 — Mobile bottom sheet wrapper: duplicated 3×

**Severity**: 🟡 Medium

**Problem**: The mobile bottom sheet wrapper (fixed bottom div + `useSheetDrag` + drag handle) is repeated in:
- `frontend/src/components/Routes/RouteDetails.tsx:68-99` (inline)
- `frontend/src/components/Journeys/JourneyDetails.tsx:222-270` (`JourneyDetailsMobile` export)
- `frontend/src/components/Destinations/DestinationDetails.tsx:110-141` (`DestinationDetailsMobile` export)

All three use `snapPoints: [65, 92]`, the same className pattern, and the same drag handle `<div className="mx-auto h-1 w-12 rounded-full bg-gray-700" />`.

**Fix**: Extract `frontend/src/components/AppShell/BottomSheet.tsx` — a generic wrapper that accepts `children`, `onDismiss`, `onHeightChange`. All Detail components use it.

**Affected files**: The 3 files above.

---

## A-08 — useHistory.recordView: setState on unmounted component

**Severity**: 🟡 Medium

**Problem**: `recordView()` in `useHistory.ts` fires a Supabase insert and then calls `refreshHistory()` in the `.then()` callback. If the component unmounts before the callback executes (e.g. user navigates away within 2 seconds), `setEntries()` is called on an unmounted component.

```typescript
// useHistory.ts
function recordView(routeId: string): void {
  supabase.from('user_history').insert(...).then(() => refreshHistory(user.id))
  //                                                  ^^^ no check if still mounted
}
```

**Fix**: Use an `AbortController` or a `mounted` ref:
```typescript
const mounted = useRef(true)
useEffect(() => () => { mounted.current = false }, [])

// In refreshHistory:
.then(({ data }) => {
  if (mounted.current && data) setEntries(...)
})
```

**Affected files**:
- `frontend/src/hooks/useHistory.ts`

---

## A-09 — useFavorites: optimistic update non-atomic

**Severity**: 🟡 Medium

**Problem**: `toggleFavorite()` updates `favoriteIds` optimistically (immediately) and only updates `favoriteRoutes` after a successful Supabase response. If the request fails:
- `favoriteIds` is rolled back correctly
- `favoriteRoutes` is never updated (it wasn't changed yet) — but they can drift if other operations occur between optimistic update and rollback

The two state pieces (`favoriteIds: Set<string>` and `favoriteRoutes: Route[]`) can become inconsistent during network errors.

**Fix**: Use a single state object, or ensure rollback covers both state pieces atomically.

**Affected files**:
- `frontend/src/hooks/useFavorites.ts:62-105`

---

## A-10 — RouteDetails: 13 props + mixed responsibilities

**Severity**: 🟡 Medium

**Problem**: `RouteDetails` and its inner `DetailsContent` function accept 13 props including auth state, callbacks, sub-route hierarchy, and POI data. The component simultaneously:
1. Renders UI
2. Filters children by relationship type (`useMemo` for extensions/variants/segments)
3. Manages GPX download state
4. Handles the mobile bottom sheet lifecycle

`JourneyDetails` (9 props) and `DestinationDetails` (5 props) are significantly simpler.

**Fix**: Extract sub-route filtering to a custom hook. Move GPX logic to `lib/gpx.ts` (see A-06). Auth-related props (`isFavorite`, `isAuthenticated`, callbacks) can come from context after A-02 is fixed.

**Affected files**:
- `frontend/src/components/Routes/RouteDetails.tsx`

---

## A-11 — Skeleton loading components: duplicated 6×

**Severity**: 🟢 Low

**Problem**: `SkeletonCard` (or equivalent) is defined locally in:
- `RouteList.tsx:22`
- `RoadList.tsx:15`
- `JourneyList.tsx:11`
- `DestinationList.tsx:11`
- `JourneyDetails.tsx:69` (`SkeletonStage`)
- `DestinationDetails.tsx:15` (`SkeletonRoute`)

All use `animate-pulse` + `bg-gray-700`/`bg-gray-800` with slightly different dimensions but the same visual pattern.

**Fix**: `frontend/src/components/Skeleton.tsx` with `<SkeletonCard>`, `<SkeletonLine width="3/4" />` variants. Low priority — only matters when changing the loading style globally.

---

## A-12 — Sheet snap points: inconsistent values

**Severity**: 🟢 Low

**Problem**: Snap points are hardcoded in 6 files with two different values:
- Detail components (`RouteDetails`, `JourneyDetailsMobile`, `DestinationDetailsMobile`): `[65, 92]`
- Page list sheets (`RoutesPage`, `JourneysPage`, `DestinationsPage`): `[65, 95]`

The difference (92 vs 95 for "full open") appears unintentional.

**Fix**: Define constants in `frontend/src/lib/constants.ts`:
```typescript
export const SHEET_SNAP_DETAIL = [65, 92]  // or 95 — pick one
export const SHEET_SNAP_LIST = [65, 95]
```

---

## A-13 — Back/close button: SVG duplicated 3×

**Severity**: 🟢 Low

**Problem**: Identical back-arrow button (SVG path + className) in:
- `RouteDetails.tsx:196`
- `JourneyDetails.tsx:103`
- `DestinationDetails.tsx:45`

**Fix**: `frontend/src/components/AppShell/BackButton.tsx` — 10-line component. Trivial but clean.

---

## What to do with this file

- **Before any refactor**: check if the files you're touching have open issues here
- **When fixing an issue**: mark it ✅, add fix date and commit reference
- **When discovering new issues**: add them following the same format
- **Do not** introduce new instances of patterns already flagged (e.g. do not add a 4th Skeleton component locally, do not add a 4th LoginModal render)
