# Troubleshooting

> Problems encountered and their solutions during development.
> Add new problems as they arise.

---

## Inverted coordinates on map

**Symptom**: Routes appear in wrong location (e.g., middle of ocean)

**Cause**: Using `(latitude, longitude)` order instead of `(longitude, latitude)`

**Solution**: Always use `(longitude, latitude)` - Mapbox/GeoJSON standard

The `coordinate-rules` skill loads automatically when working with maps or GPX.

```javascript
// WRONG
const point = [41.1404, -7.9134]; // lat, lon

// CORRECT
const point = [-7.9134, 41.1404]; // lon, lat
```

---

## GPX not importing correctly

**Symptom**: Import script fails or data is incorrect

**Possible causes**:
1. Malformed GPX (verify with gpxpy)
2. Encoding is not UTF-8
3. Coordinates in wrong format

**Solution**:
```python
import gpxpy

with open('route.gpx', 'r', encoding='utf-8') as f:
    gpx = gpxpy.parse(f)
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                print(f"lon: {point.longitude}, lat: {point.latitude}")
```

---

## Supabase connection fails

**Symptom**: Connection or authentication error

**Check**:
1. URL and API key in `.env` are correct
2. Supabase project is active (not paused)
3. RLS is not blocking (check policies)

**Test connection**:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const { data, error } = await supabase.from('routes').select('count')
console.log(data, error)
```

---

## Mapbox not loading

**Symptom**: Map appears blank or with error

**Check**:
1. Mapbox token is valid and not expired
2. Token has correct permissions (styles, tiles)
3. Domain is in token whitelist

**Debug**:
```javascript
console.log('Mapbox token:', import.meta.env.VITE_MAPBOX_TOKEN?.substring(0, 10))
```

---

## Slow PostGIS queries

**Symptom**: Spatial queries take too long

**Solution**: Add spatial index

```sql
CREATE INDEX routes_geometry_idx ON routes USING GIST (geometry);
CREATE INDEX pois_geometry_idx ON pois USING GIST (geometry);
```

---

## Line animation not working

**Symptom**: Route appears all at once, no animation

**Check**:
1. `line-dasharray` is configured
2. Animation uses `requestAnimationFrame`
3. GeoJSON data has enough coordinates

**Mapbox example**:
```javascript
map.addLayer({
  id: 'route-line',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#3b82f6',
    'line-width': 4,
    'line-dasharray': [0, 4, 0] // Start: invisible
  }
});

// Animate
let step = 0;
function animate() {
  step += 0.01;
  map.setPaintProperty('route-line', 'line-dasharray', [step, 4 - step, 0]);
  if (step < 4) requestAnimationFrame(animate);
}
animate();
```

---

## Vite HMR not working

**Symptom**: Code changes don't update browser

**Check**:
1. Development server is running
2. No errors in console
3. Browser is not in aggressive cache mode

**Solution**:
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

---

## TypeScript types out of sync

**Symptom**: Type errors after schema changes

**Solution**: Types are hand-written in `frontend/src/types/database.ts`. Edit this file manually after schema changes.

Add or update the relevant interface in `Database['public']['Tables']` or `Database['public']['Functions']` to match the new schema.

---

## RLS blocking queries

**Symptom**: Queries return empty results even though data exists

**Check**:
1. RLS is enabled on the table
2. Policy exists for the operation (SELECT, INSERT, etc.)
3. User role matches policy (public, authenticated)

**Debug**:
```sql
-- Check policies on a table
SELECT * FROM pg_policies WHERE tablename = 'routes';

-- Temporarily disable RLS (development only!)
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
```

---

## PostGIS geometry column returns null in JS

**Symptom**: POI positions are `null` or `undefined` — markers don't appear on map

**Cause**: The Supabase JavaScript client cannot deserialize PostGIS `geometry` binary format. All geometry columns return `null` when queried directly.

**Solution**: Create a SQL RPC function that extracts coordinates using `ST_X`/`ST_Y`:

```sql
CREATE OR REPLACE FUNCTION get_pois_for_route(p_route_id uuid)
RETURNS TABLE (longitude double precision, latitude double precision, ...)
LANGUAGE sql STABLE AS $$
  SELECT ST_X(p.geometry::geometry), ST_Y(p.geometry::geometry), ...
  FROM pois p JOIN route_pois rp ON rp.poi_id = p.id
  WHERE rp.route_id = p_route_id;
$$;
```

For routes, the workaround used is caching GeoJSON in `geometry_geojson` (a plain JSON column) at import time. See DEC-002.

---

## Supabase RPC TypeScript: Argument type error with custom functions

**Symptom**: `Argument of type '{ arg: string }' is not assignable to parameter of type 'undefined'`

**Cause**: Supabase's `rpc()` generic signature defaults `Args` to `never` when TypeScript cannot infer it from the function union type. `args?: never` only accepts `undefined`, so any object fails.

**Solution**: Use `as never` cast on the arguments object. The value is passed correctly at runtime; only the TypeScript type check is bypassed.

```typescript
// Error:
await supabase.rpc('get_pois_for_route', { p_route_id: routeId })

// Fix:
await supabase.rpc('get_pois_for_route', { p_route_id: routeId } as never)
```

Also add the function to `Database['public']['Functions']` in `types/database.ts`:
```typescript
Functions: {
  get_pois_for_route: {
    Args: { p_route_id: string }
    Returns: { id: string; longitude: number; latitude: number; ... }[]
  }
}
```

---

## Mapbox GL POI markers not visible

**Symptom**: POI circles/labels not showing on map even though source has data

**Check**:
1. POI layers are added AFTER route layers in `map.on('load')` (ordering matters)
2. Source data is non-empty: `map.getSource('pois').getData()` in browser console
3. Coordinates are `[longitude, latitude]` order — not reversed

```typescript
// Correct layer order in map.on('load'):
addRouteLayers(map)  // first
addPOILayers(map)    // second — renders on top
```

---

## WKT LINESTRING geometry rejected by PostGIS

**Symptom**: `invalid geometry` error when inserting routes via Python pipeline

**Cause**: PostGIS WKT format requires comma+space between coordinate pairs: `lon lat, lon lat`. Using only space causes a parse error.

**Solution**:
```python
# WRONG — space only between coordinate pairs
wkt = "LINESTRING(" + " ".join(f"{lon} {lat}" for lon, lat in coords) + ")"

# CORRECT — comma+space between pairs, space within pair
wkt = "LINESTRING(" + ", ".join(f"{lon} {lat}" for lon, lat in coords) + ")"
```

---

## Google OAuth callback not completing

**Symptom**: After Google login, app redirects back but user is not authenticated. Console shows no error.

**Cause**: React Router strips query parameters when navigating to the root path, so the `?code=` callback parameter is lost before Supabase can process it.

**Solution**: In `useAuth.ts`, use `redirectTo: window.location.origin + window.location.pathname` instead of just `window.location.origin`.

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + window.location.pathname,
  },
})
```

Also ensure both `http://localhost:5174/**` and `https://moto-routes.vercel.app/**` are in the Supabase Dashboard Redirect URLs whitelist (Authentication > URL Configuration).

---

## Bottom sheet drag not working on mobile

**Symptom**: The bottom sheet on mobile doesn't respond to drag gestures.

**Cause**: Touch events may not be propagating correctly or the `useSheetDrag` hook state is out of sync.

**Debug**: Check that the drag handle element has the correct event listeners attached via `useSheetDrag`. Verify that `touchstart`/`touchmove`/`touchend` events are not being prevented by parent elements.

The drag handle must have `touchAction: none` applied via inline style or Tailwind `touch-none` to prevent the browser from intercepting touch gestures for scrolling. The outer sheet div should use `flex flex-col overflow-hidden`, with the scrollable content in the inner div only.

---

## Template for New Problems

```markdown
## [Problem Title]

**Symptom**: [What you observed]

**Cause**: [Why it happens]

**Solution**: [How to fix it]

**Code example** (if applicable):
\`\`\`
[code]
\`\`\`
```

---

## Related Documents

- [Setup](./SETUP.md) - Environment configuration
- [Patterns](./PATTERNS.md) - Best practices
- [Schema](./SCHEMA.md) - Database structure
