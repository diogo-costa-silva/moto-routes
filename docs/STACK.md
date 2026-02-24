# Technology Stack

> Technology choices and rationale for Moto Routes.

---

## Overview

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 7.x |
| Styling | Tailwind CSS | 4.x |
| Maps | Mapbox GL JS | 3.x |
| Routing | React Router | 7.x |
| Backend | Supabase | Latest |
| Database | PostgreSQL + PostGIS | 15+ / 3.4+ |
| Hosting | Vercel | - |
| Database Hosting | Supabase Cloud | - |

---

## Frontend

### React 19

**Why React?**
- Mature ecosystem with extensive documentation
- Component-based architecture fits our UI needs
- Large community for troubleshooting
- React 19 brings performance improvements

**Alternatives Considered:**
- Vue.js - Equally valid, React chosen for familiarity
- SolidJS - Smaller ecosystem
- Svelte - Less mature for complex map interactions

### TypeScript

**Why TypeScript?**
- Catch errors at compile time
- Better IDE support and autocomplete
- Self-documenting code
- Essential for maintainability

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### Vite

**Why Vite?**
- Extremely fast development server
- Native ES modules
- Built-in TypeScript support
- Simple configuration

**Alternatives Considered:**
- Create React App - Slower, more opinionated
- Next.js - Overkill for this project (no SSR needed)

### Tailwind CSS

**Why Tailwind?**
- Utility-first approach speeds up development
- Built-in responsive design utilities
- Consistent spacing and colors
- Small production bundle with purging

**Configuration:**
- Mobile-first breakpoints
- Custom color palette for routes

### Mapbox GL JS

**Why Mapbox?**
- Best-in-class vector maps
- Smooth animations and transitions
- Extensive customization options
- Good free tier (50k loads/month)

**Alternatives Considered:**
- Leaflet - Less smooth animations
- Google Maps - More expensive, less customization
- OpenLayers - Steeper learning curve

**Key Features Used:**
- Line layers for routes
- Custom markers for POIs
- Fly-to animations
- GeoJSON data sources

---

## Backend

### Supabase

**Why Supabase?**
- PostgreSQL with PostGIS support
- Built-in authentication
- Row Level Security
- Real-time subscriptions (future)
- Generous free tier

**Services Used:**
- Database (PostgreSQL)
- Auth (email + OAuth)
- Storage (future: route images)

**Alternatives Considered:**
- Firebase - No PostGIS support
- Custom backend - More work to maintain
- PlanetScale - No PostGIS

### PostgreSQL + PostGIS

**Why PostgreSQL?**
- Robust, battle-tested database
- Excellent geospatial support with PostGIS
- Complex queries for spatial data

**PostGIS Features Used:**
- `geometry(LineString, 4326)` for routes
- `ST_Length()` for distance calculations
- `ST_DWithin()` for proximity queries
- `ST_AsGeoJSON()` for frontend conversion

---

## Data Pipeline

### Python 3.11+

**Why Python?**
- Excellent GPX parsing libraries
- Simple scripting for data import
- Good geospatial libraries

**Libraries:**
- `gpxpy` - GPX file parsing
- `geopy` - Geodetic calculations
- `supabase-py` - Database client

---

## Deployment

### Vercel

**Why Vercel?**
- Zero-config deployment for Vite
- Automatic HTTPS
- Global CDN
- Free tier sufficient

**Alternatives Considered:**
- Netlify - Equally valid
- Cloudflare Pages - Good option
- Self-hosted - Unnecessary complexity

### Supabase Cloud

**Why Supabase Cloud?**
- Managed PostgreSQL
- Automatic backups
- No server maintenance
- Free tier: 500MB database, 1GB bandwidth

---

## Cost Analysis

| Service | Free Tier | Our Usage | Cost |
|---------|-----------|-----------|------|
| Vercel | 100GB bandwidth | ~1GB/month | $0 |
| Supabase | 500MB DB, 2 projects | 1 project, <100MB | $0 |
| Mapbox | 50k loads/month | ~1k loads/month | $0 |
| **Total** | | | **$0/month** |

---

## Version Pinning

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "mapbox-gl": "^3.0.0",
    "@supabase/supabase-js": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## Related Documents

- [Architecture](./ARCHITECTURE.md) - How components interact
- [Setup](./SETUP.md) - Installation instructions
- [Decisions](./DECISIONS.md) - Why we made these choices
