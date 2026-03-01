# Patterns & Best Practices

> Lessons learned from previous iterations of this project.

> **Note:** The canonical TypeScript and Supabase patterns used by Claude Code are in [`CLAUDE.md`](../CLAUDE.md).
> This document contains expanded examples and the reasoning behind each pattern.

---

## Overview

These patterns come from multiple attempts to build this platform. Following them avoids mistakes already made.

---

## Database Patterns

### PostGIS for Geometry

Use `geometry(LineString, 4326)` for efficient geospatial queries.

```sql
-- Good: Native PostGIS type
geometry geometry(LineString, 4326)

-- Enables efficient queries
SELECT * FROM routes
WHERE ST_DWithin(geometry::geography, point::geography, 50000);
```

### Cache GeoJSON

Store pre-calculated `geometry_geojson` to avoid frontend conversion on every request.

```sql
-- In routes table
geometry_geojson JSON  -- Cached for frontend
```

### ENUMs for Fixed Types

Use PostgreSQL ENUMs for constrained values.

```sql
-- Good: Type-safe, efficient filtering
CREATE TYPE landscape_type AS ENUM (
  'coast', 'mountain', 'forest', 'urban', 'river_valley', 'mixed'
);

-- Usage
landscape_type landscape_type NOT NULL DEFAULT 'mixed'
```

### Separate Road from Route

- **Road**: Abstract administrative designation (N222 historically had 100km)
- **Route**: Traceable path with actual GPX geometry

```sql
-- Road is reference only
roads (id, code, designation, status, is_continuous)

-- Route always has geometry
routes (id, ..., geometry, road_id REFERENCES roads)
```

### Variant Relationships

Use self-referencing foreign keys for route relationships.

```sql
-- In routes table
is_segment_of UUID REFERENCES routes(id),
is_extension_of UUID REFERENCES routes(id),
is_variant_of UUID REFERENCES routes(id)
```

### SQL RPC for PostGIS Geometry in JS Client

PostGIS `geometry` columns return `null` in the Supabase JavaScript client. Use a SQL function with `ST_X`/`ST_Y` to extract coordinates server-side.

```sql
-- Bad: geometry column returns null in JS
SELECT id, name, geometry FROM pois;

-- Good: extract coordinates via RPC
CREATE OR REPLACE FUNCTION get_pois_for_route(p_route_id uuid)
RETURNS TABLE (
  id uuid, name text,
  longitude double precision,
  latitude double precision
) LANGUAGE sql STABLE AS $$
  SELECT p.id, p.name,
    ST_X(p.geometry::geometry) AS longitude,
    ST_Y(p.geometry::geometry) AS latitude
  FROM pois p JOIN route_pois rp ON rp.poi_id = p.id
  WHERE rp.route_id = p_route_id;
$$;
```

Call from JS:
```typescript
const { data } = await supabase.rpc('get_pois_for_route', { p_route_id: id } as never)
// Note: `as never` cast needed — see Troubleshooting for explanation
```

---

## Python Pipeline Patterns

### Keep It Under 500 LOC

Previous versions had 5000+ lines - impossible to maintain.

```
Target: <500 total lines of Python
Reality check: If it needs more, you're over-engineering
```

### Use gpxpy for Parsing

Mature library that handles malformed GPX gracefully.

```python
import gpxpy

with open('route.gpx', 'r') as f:
    gpx = gpxpy.parse(f)

for track in gpx.tracks:
    for segment in track.segments:
        for point in segment.points:
            # point.latitude, point.longitude, point.elevation
```

### Use geopy for Geodesy

Distance calculations, bearings, etc.

```python
from geopy.distance import geodesic

dist = geodesic(
    (lat1, lon1),
    (lat2, lon2)
).kilometers
```

### Calculate Metrics at Import Time

Don't calculate in frontend - do it once during import.

```python
# Calculate during import
elevation_gain = calculate_elevation_gain(points)
curve_count = count_curves(points)
distance_km = calculate_distance(points)

# Store in database
INSERT INTO routes (..., elevation_gain, curve_count, distance_km)
```

### Validate Coordinate Order

**CRITICAL**: Always `(longitude, latitude)` for Mapbox/PostGIS.

```python
# WRONG - common mistake
point = (latitude, longitude)

# CORRECT
point = (longitude, latitude)  # Mapbox standard
```

---

## Frontend Patterns

### Hook Pattern for Data

Encapsulate fetch, cache, and loading states.

```typescript
// Good: Clean separation
function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // fetch logic...

  return { routes, loading, error };
}

// Usage
const { routes, loading } = useRoutes();
```

### Mapbox Line Animation

Use animated `line-dasharray` for drawing effect.

```typescript
// Animate line drawing
map.setPaintProperty('route-line', 'line-dasharray', [
  currentStep,
  totalLength - currentStep
]);
```

### Focused Components

One component = one responsibility.

```
Good:
- RouteMap.tsx       → Map rendering
- RouteAnimation.tsx → Drawing animation
- POIMarkers.tsx     → POI display

Bad:
- RouteMap.tsx doing map + animation + POIs + details
```

### Mobile-First

Motorcyclists use phones. Design for mobile, enhance for desktop.

```typescript
// Good: Bottom sheet for mobile
<BottomSheet>
  <RouteDetails route={selected} />
</BottomSheet>

// Bad: Desktop-only sidebar
<Sidebar>...</Sidebar>
```

### Fly-To Animations

Smooth transitions when changing routes.

```typescript
map.flyTo({
  center: [route.center_lon, route.center_lat],
  zoom: 12,
  duration: 1500
});
```

### Mapbox GL: Type Imports Only

Import Mapbox types with `import type` to avoid bundling the full library twice. Use the default `import mapboxgl` only in the component that initialises the map.

```typescript
// mapLayers.ts — type-only import (no bundle overhead)
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'

// RouteMap.tsx — full import only here (initialises map)
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
```

### Mapbox GL: Layer Ordering Matters

Layers are rendered in the order they are added. POI circles and labels must be added AFTER route lines, or they will be hidden behind them.

```typescript
map.on('load', () => {
  addRouteSources(map, [])
  addRouteLayers(map)   // route lines first
  addPOISources(map)
  addPOILayers(map)     // POI circles on top
})
```

### Mapbox GL: Popup via mapboxgl.Popup (not React)

For popups triggered by map events, use `mapboxgl.Popup` with HTML string — not a React component. React can't manage DOM inside the Mapbox canvas.

```typescript
const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '260px' })
  .setLngLat(coordinates)
  .setHTML(`<strong>${name}</strong><p>${description}</p>`)
  .addTo(map)

// Always clean up
popupRef.current?.remove()
popupRef.current = popup
```

### Mapbox GL: mapRef in Event Listener Closures

TypeScript narrows `mapRef.current` to `null` inside closures. Use non-null assertion `!` inside event listeners where the map is guaranteed to exist.

```typescript
// Inside map.on('mousemove', ...) — map is guaranteed to exist
mapRef.current!.getCanvas().style.cursor = 'pointer'
```

---

## GPX Export Patterns

### Valid XML

Follow GPX 1.1 spec with correct namespace.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="Moto Routes"
     xmlns="http://www.topografix.com/GPX/1/1">
```

### Complete Metadata

Apps like Strava display this information.

```xml
<metadata>
  <name>N222 - Estrada do Douro</name>
  <desc>One of the world's best motorcycle roads</desc>
  <author><name>Moto Routes</name></author>
  <link href="https://motoroutes.com/routes/n222"/>
</metadata>
```

### UTF-8 Encoding

Portuguese names have accents - UTF-8 is mandatory.

```python
# Always specify encoding
with open('route.gpx', 'w', encoding='utf-8') as f:
    f.write(gpx_content)
```

### Optional Waypoints

POIs can be included as waypoints if user wants them.

```xml
<wpt lat="41.1234" lon="-8.5678">
  <name>Miradouro S. Leonardo</name>
  <desc>Stunning viewpoint over Douro Valley</desc>
  <type>viewpoint</type>
</wpt>
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Consequence | Solution |
|--------------|-------------|----------|
| OSM automation | 61% success rate, fragmented routes | GPX-first with real data |
| Complex pipeline | 5000 LOC, impossible to debug | Keep under 500 LOC |
| API keys in repo | Security compromise | .env + .gitignore from day 1 |
| Flat data model | No relationships, duplicated data | 4-layer hierarchy |
| Desktop-first UI | Unusable on mobile | Mobile-first with Tailwind |
| Calculate in frontend | Slow, inconsistent | Pre-calculate at import |
| Mixed coordinate order | Broken map display | Always (lon, lat) |
| Query PostGIS geometry directly | JS receives `null` | Use SQL RPC with ST_X/ST_Y |

---

## Code Style

### TypeScript

```typescript
// Strict mode always
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### Naming Conventions

```typescript
// Components: PascalCase
RouteMap.tsx
POIMarkers.tsx

// Hooks: camelCase with 'use' prefix
useRoutes.ts
useFavorites.ts

// Types: PascalCase
interface Route { ... }
type LandscapeType = 'coast' | 'mountain' | ...
```

### File Organization

```
components/
├── Map/           # Map-related components
├── Details/       # Detail panels
├── Auth/          # Authentication
└── UI/            # Shared UI components
```

---

## Related Documents

- [Architecture](./ARCHITECTURE.md) - System design
- [Schema](./SCHEMA.md) - Database structure
