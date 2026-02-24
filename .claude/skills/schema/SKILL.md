---
name: schema
description: Mostra o schema da base de dados do projecto Moto Routes
user_invocable: true
auto_invoke:
  when: "working with database schema, tables, migrations, or database design"
allowed_tools:
  - Read
---

# Skill: /schema

## Objectivo
Mostrar ao utilizador o schema da base de dados de forma clara e utilizável.

## Instruções

1. **Ler docs/SCHEMA.md** (Schema completo da BD)

2. **Responder com formato estruturado**:

```
## Schema da Base de Dados

### Tabelas Principais

| Tabela | Propósito | Campos Chave |
|--------|-----------|--------------|
| routes | Rotas GPS | id, name, geometry, distance_km |
| journeys | Viagens multi-etapa | id, name, type |
| ... | ... | ... |

### ENUMs

| Enum | Valores |
|------|---------|
| landscape_type | coast, mountain, forest, urban, river_valley, mixed |
| poi_association_type | on_route, near_route, detour |
| ... | ... |

### Relações Principais

- journey_stages: liga journeys → routes
- route_pois: liga routes → pois
- ...

### Notas PostGIS

- Geometria: geometry(LineString, 4326)
- GeoJSON: ST_AsGeoJSON(geometry)::json
- Coordenadas: SEMPRE (longitude, latitude)
```

## Notas
- Incluir informação do docs/SCHEMA.md
- Destacar que coordenadas são (longitude, latitude) - ver /coordinate-rules
- Mencionar campos úteis para queries comuns
