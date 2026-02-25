# Moto Routes v4 - Quick Context

## Em 30 Segundos

Plataforma de rotas de mota. React + Supabase + PostGIS.
7 rotas GPX prontas. Fase actual: 5 — Journeys. Ver PROGRESS.md para detalhe.

---

## Modelo de Dados

```
DESTINATION → JOURNEY → ROUTE → ROAD
                ↓
              POI (on_route / near_route / detour)
```

---

## Regra de Ouro

**Coordenadas: (longitude, latitude)** - Longitude SEMPRE primeiro!

Portugal: lon -9 a -6, lat 37 a 42

---

## Comandos Rápidos

| Comando | O que faz |
|---------|-----------|
| `/status` | Onde estou |
| `/next` | O que fazer |
| `/phase` | Critérios da fase |
| `/schema` | Tabelas da BD |
| `/docs` | Mapa de documentação |

---

## Subagents Disponíveis

| Categoria | Subagents |
|-----------|-----------|
| **Dados** | `gpx-analyst`, `db-helper` |
| **Código** | `react-builder`, `test-writer`, `refactorer` |
| **Qualidade** | `code-reviewer`, `bug-hunter` |
| **Design** | `ux-designer`, `ui-designer` |
| **Docs** | `doc-writer` |

---

## Documentação

| Documento | Contém |
|-----------|--------|
| [docs/INDEX.md](./docs/INDEX.md) | Mapa de navegação |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Fases de implementação |
| [docs/SCHEMA.md](./docs/SCHEMA.md) | Schema da BD |
| [PROGRESS.md](./PROGRESS.md) | Estado actual |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Porquê assim |
| [CLAUDE.md](./CLAUDE.md) | Regras de dev |

---

## Stack

```
Frontend:  React 19 + TypeScript + Vite + Tailwind + Mapbox GL JS
Backend:   Supabase (PostgreSQL + PostGIS)
Pipeline:  Python 3.11 + gpxpy + geopy
Deploy:    Vercel + Supabase Cloud
```
