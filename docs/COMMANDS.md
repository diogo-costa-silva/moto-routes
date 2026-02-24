# Commands Reference

> Quick reference for development, build, and deployment commands.

---

## Frontend Development

### Start Development Server

```bash
cd frontend
npm run dev
```

Server runs at `http://localhost:5173`

### Type Checking

```bash
cd frontend
npm run type-check
```

### Lint Code

```bash
cd frontend
npm run lint
```

### Build for Production

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`

### Preview Production Build

```bash
cd frontend
npm run preview
```

---

## Python Pipeline

### Setup Virtual Environment

```bash
cd scripts
python -m venv venv
source venv/bin/activate  # Linux/Mac
```

### Install Dependencies

```bash
pip install gpxpy geopy supabase python-dotenv
```

### Import a GPX Route

```bash
cd scripts
source venv/bin/activate

python import_gpx.py ../data/pt/pt-n222.gpx \
  --code "pt-n222" \
  --name "N222 Estrada do Douro"
```

### Import with Full Options

```bash
python import_gpx.py ../data/pt/pt-n304-alvao.gpx \
  --code "pt-n304-alvao" \
  --name "N304 Serra do Alvao" \
  --landscape "mountain" \
  --description "One of Europe's best motorcycle roads"
```

### Import All Routes (Batch)

```bash
# Create a batch script or run individually
for gpx in ../data/pt/*.gpx ../data/es/*.gpx; do
  python import_gpx.py "$gpx"
done
```

---

## Database

### Generate TypeScript Types

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > frontend/src/types/database.ts
```

### Reset Database

In Supabase SQL Editor:

```sql
-- WARNING: Deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
CREATE EXTENSION IF NOT EXISTS postgis;
-- Then re-run schema.sql
```

### Backup Database

```bash
pg_dump "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
  > backup_$(date +%Y%m%d).sql
```

### Quick Queries

```bash
# Count routes
psql "postgresql://..." -c "SELECT COUNT(*) FROM routes;"

# List all routes
psql "postgresql://..." -c "SELECT code, name, distance_km FROM routes;"
```

---

## Deployment

### Deploy to Vercel

```bash
cd frontend
vercel --prod
```

### Deploy with Environment Variables

```bash
vercel --prod \
  -e VITE_MAPBOX_TOKEN=pk.xxx \
  -e VITE_SUPABASE_URL=https://xxx.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Check Deployment Status

```bash
vercel ls
```

### View Deployment Logs

```bash
vercel logs [deployment-url]
```

---

## Git

### Create Feature Branch

```bash
git checkout -b feature/route-animation
```

### Commit with Standard Message

```bash
git add .
git commit -m "feat: add route drawing animation"
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code refactoring |
| `test` | Tests |
| `chore` | Maintenance |

---

## Supabase CLI

### Login

```bash
npx supabase login
```

### Link Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Push Schema Changes

```bash
npx supabase db push
```

### Pull Remote Schema

```bash
npx supabase db pull
```

---

## Useful Shortcuts

### Check Everything

```bash
# Frontend health check
cd frontend && npm run type-check && npm run lint && npm run build

# Pipeline health check
cd scripts && python -c "import gpxpy, geopy, supabase; print('OK')"
```

### Quick Database Check

```sql
-- Run in Supabase SQL Editor
SELECT
  'routes' as table_name, COUNT(*) as count FROM routes
UNION ALL
SELECT 'journeys', COUNT(*) FROM journeys
UNION ALL
SELECT 'destinations', COUNT(*) FROM destinations
UNION ALL
SELECT 'pois', COUNT(*) FROM pois;
```

### Test Supabase Connection

```typescript
// In browser console or test file
import { supabase } from './services/supabase';

const { data, error } = await supabase
  .from('routes')
  .select('count');

console.log(data, error);
```

---

## Environment Files

### Frontend `.env`

```env
VITE_MAPBOX_TOKEN=pk.your_mapbox_token
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Scripts `.env`

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here  # Service role, not anon!
```

---

## Claude Code Skills

### User-Invocable Skills

| Command | Description |
|---------|-------------|
| `/status` | Show current project state |
| `/next` | Suggest next task to work on |
| `/phase` | Show current phase validation criteria |
| `/schema` | Display database schema |
| `/docs` | Show documentation map |
| `/frontend-design` | Create distinctive UI components (plugin) |

### Auto-Loading Skills

| Skill | When it loads |
|-------|---------------|
| `coordinate-rules` | Working with maps, GPX, geometry, PostGIS |
| `mapbox-rules` | Working with Mapbox GL JS |
| `supabase-rules` | Working with Supabase/PostGIS |

### Using `/frontend-design`

The frontend-design plugin creates distinctive, production-grade UI:

```
/frontend-design "Create a route card component with map preview"
```

Features:
- High-quality visual design
- Avoids generic AI aesthetics
- Production-ready code
- Tailwind CSS styling

---

## Related Documents

- [Setup](./SETUP.md) - Full environment setup
- [Data](./DATA.md) - GPX files and import details
- [Patterns](./PATTERNS.md) - Best practices
- [Claude Guide](../CLAUDE.md) - Claude Code configuration and agents
