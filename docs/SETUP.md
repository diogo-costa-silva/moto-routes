# Setup Guide

> Environment configuration for Moto Routes development.

**Project Reference**: `epaxdcbvbysjrnwuffay`
**Project URL**: `https://epaxdcbvbysjrnwuffay.supabase.co`

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Python | 3.11+ | `python --version` |
| Git | 2.40+ | `git --version` |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/moto-routes-v4.git
cd moto-routes-v4

# 2. Initialize frontend (first time only)
npm create vite@latest frontend -- --template react-ts
cd frontend

# 3. Install dependencies
npm install

# 4. Configure environment
cp ../.env.example .env
# Edit .env with your credentials

# 5. Start development server
npm run dev
```

> **Note**: If `frontend/` already exists with a `package.json`, skip step 2 and go directly to step 3.

---

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Select region: **eu-west-1** (Ireland)
4. Note your project URL and keys

### 2. Enable PostGIS

In Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Run Schema

Copy the contents of `scripts/schema.sql` and execute in Supabase SQL Editor.

### 4. Get Credentials

From Project Settings > API:

| Credential | Environment Variable | Usage |
|------------|---------------------|-------|
| Project URL | `VITE_SUPABASE_URL` | Frontend + Scripts |
| anon public key | `VITE_SUPABASE_ANON_KEY` | Frontend (public) |
| service_role key | `SUPABASE_SERVICE_KEY` | Python scripts only (private) |

**Project Reference** is in the project URL:
```
https://supabase.com/dashboard/project/[PROJECT_REF]
                                        ^^^^^^^^^^^^
```

### 5. Configure Auth Redirect URLs

In the Supabase Dashboard → **Authentication** → **URL Configuration**, add the following to the **Redirect URLs** list:

- `http://localhost:5174` (development)
- Your production domain (e.g. `https://moto-routes.vercel.app`)

This is required for Google OAuth and email magic-link flows to work correctly.

---

## MCP Configuration

The MCP (Model Context Protocol) allows Claude Code to interact directly with Supabase - execute queries, apply migrations, and manage the database.

### 1. Create Configuration File

Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Replace `YOUR_PROJECT_REF` with your Supabase Project Reference.

### 2. Authenticate in Claude Code

1. Open terminal in project directory
2. Run: `claude` (start Claude Code)
3. Execute: `/mcp`
4. Follow OAuth authentication link
5. Authorize access to Supabase project

**Expected output**:
```
Authentication successful. Connected to supabase.
```

### 3. Test Connection

After authentication, test with simple queries:

```
# List tables
mcp__supabase__list_tables

# Get project URL
mcp__supabase__get_project_url

# List extensions
mcp__supabase__list_extensions
```

---

## Mapbox Setup

### 1. Create Account

1. Go to [mapbox.com](https://www.mapbox.com)
2. Create free account
3. Go to Access Tokens

### 2. Create Token

1. Create new token
2. Enable scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
3. Restrict URLs (optional but recommended):
   - `http://localhost:*`
   - Your production domain

### 3. Copy Token

Use the token starting with `pk.` for `VITE_MAPBOX_ACCESS_TOKEN`.

---

## Environment Variables

### Frontend (`frontend/.env`)

```env
# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ...your_token

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key
```

### Python Scripts (`scripts/.env`)

```env
# Supabase (Service Role for admin access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your_service_key
```

### Security Rules

- **NEVER** commit `.env` files
- **NEVER** use `service_role` key in frontend
- Add to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
frontend/.env
scripts/.env
```

---

## Frontend Development

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Dev Server

```bash
npm run dev
```

Server runs at `http://localhost:5174`

### Build for Production

```bash
npm run build
```

Output in `frontend/dist/`

### Type Checking

```bash
npm run typecheck
```

---

## Python Pipeline

Run from the **project root** (not `frontend/`):

```bash
uv run --with gpxpy==1.6.2 --with geopy==2.4.1 --with "supabase>=2.10,<3" python scripts/import_gpx.py
```

`uv` fetches dependencies on the fly — no virtual environment setup required.

---

## Database Management

### Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > frontend/src/types/database.ts
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
pg_dump "postgresql://..." > backup.sql
```

---

## MCP Commands Reference

| Command | Description |
|---------|-------------|
| `list_tables` | List tables in schemas |
| `list_extensions` | List installed extensions |
| `list_migrations` | List applied migrations |
| `apply_migration` | Apply new SQL migration |
| `execute_sql` | Execute SQL queries (not DDL) |
| `get_project_url` | Get project URL |
| `get_publishable_keys` | Get public API keys |
| `generate_typescript_types` | Generate TypeScript types from schema |
| `get_logs` | Get logs by service |
| `get_advisors` | Get security/performance alerts |

### Usage Examples

```
# Apply migration
mcp__supabase__apply_migration
  name: "create_routes_table"
  query: "CREATE TABLE routes (...);"

# Execute query
mcp__supabase__execute_sql
  query: "SELECT * FROM routes LIMIT 10;"

# Generate TypeScript types
mcp__supabase__generate_typescript_types

# Check security alerts
mcp__supabase__get_advisors
  type: "security"
```

---

## Verification Checklist

### Supabase
- [ ] Project created
- [ ] PostGIS extension enabled
- [ ] MCP authenticated (`/mcp` in Claude Code)
- [ ] Schema executed successfully
- [ ] All tables visible in Table Editor

### Frontend
- [ ] `npm run dev` starts without errors
- [ ] Map loads at localhost:5174
- [ ] No console errors about missing env vars

### Python
- [ ] Virtual environment activated
- [ ] All packages installed
- [ ] Can connect to Supabase

---

## Common Issues

### "Missing Supabase URL"

Check that `.env` file exists and has correct format (no quotes around values).

### "PostGIS function not found"

Run `CREATE EXTENSION IF NOT EXISTS postgis;` in SQL Editor.

### "Map not loading"

1. Check Mapbox token is valid
2. Check token has correct scopes
3. Check browser console for CORS errors

### "CORS errors"

Add your development URL to Supabase URL Configuration:
- Settings > API > URL Configuration
- Add `http://localhost:5174`

### "MCP Authentication failed"

1. Verify `.mcp.json` has correct `project_ref`
2. Run `/mcp` again in Claude Code
3. Check Supabase account permissions

### "MCP Migration failed"

1. Verify SQL syntax
2. Check if extension/table already exists
3. View logs: `mcp__supabase__get_logs service: "postgres"`

---

## Next Steps

After setup is complete:

1. Run data import: `python scripts/import_gpx.py`
2. Start frontend: `npm run dev`
3. Verify routes appear on map

See [Roadmap](./ROADMAP.md) for implementation phases.

---

## Related Documents

- [Stack](./STACK.md) - Technology choices
- [Schema](./SCHEMA.md) - Database structure
- [Commands](./COMMANDS.md) - Quick reference commands
