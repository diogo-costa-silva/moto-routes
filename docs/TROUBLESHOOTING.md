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

**Solution**: Regenerate types from Supabase

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

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
