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

- [ ] How to present variants/extensions in UI?
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
