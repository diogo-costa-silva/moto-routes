# Plano de Reformulação — Moto Routes v4

## Contexto

A app tem routes com hierarquia básica (is_extension_of, is_variant_of) mas não suporta:
1. **"Alternativas"** — combinações curadas de troços sob uma designação de estrada (N222 Oficial, N222 + Mesão Frio, etc.)
2. **Hierarquia geográfica** — navegação em 6 níveis (Continente > País > Macro-região > Província histórica > Parque Natural > Distrito/Concelho)
3. **Anotação de qualidade de troços** — N103 mostra a estrada completa mas destaca o melhor troço (Braga→Chaves)

A UI passa de "lista plana de Routes" para "Roads com Alternativas + filtro geográfico integrado na página Routes".

---

## Decisões de Arquitectura

### Road → Alternativas → Segmentos

```
Road (N222)
  ├── Alternativa "N222 Oficial"      → [N222 base]
  ├── Alternativa "N222 + Mesão Frio" → [N222 base (sem troço X) + Mesão Frio]
  ├── Alternativa "N222 Margem Norte" → [N222 base (sem troço final) + Margem Norte]
  └── Alternativa "N222 Completa"     → [todos os segmentos combinados]

Road (N103)
  ├── Alternativa "N103 Oficial"      → [todos os segmentos, default]
  └── Alternativa "N103 — Melhor Troço" → [apenas Braga→Chaves, is_featured=true]
```

- Stats (distance_km, elevation_gain) **pré-calculados** na alternativa
- Geometry merged **pré-calculada** como JSONB (via ST_LineMerge no pipeline)
- `created_by` = null para curator, UUID para user (futuro)

### N304 + Gerês (Map Rendering)
Quando user navega Gerês e selecciona N304:
- Câmara faz zoom para o segmento do Gerês (fitBounds do segmento)
- Segmento do Gerês = cor primária
- Restantes segmentos da N304 = cor mais escura/opaca no mapa (visíveis ao zoom out)

### Destinations vs Geographic Areas
- **Manter** tabela `destinations` para destaques editoriais (com hero image, descrição curatorial)
- **Adicionar** `geographic_areas` para hierarquia navegável
- As 3 destinations actuais podem ter referência a `geographic_areas` correspondentes

---

## Fase 11: Database Redesign

### Fase 11a — Tabela `roads` (popular + estender)

```sql
ALTER TABLE roads ADD COLUMN hero_image_url TEXT;
ALTER TABLE roads ADD COLUMN country_code TEXT DEFAULT 'pt';
ALTER TABLE roads ADD COLUMN total_distance_km NUMERIC(8,2);

-- Popular com: N222, N304, N2, N103, es-figueres-cadaques
```

Ligar routes existentes a roads via `routes.road_id`.

### Fase 11b — Tabela `road_alternatives`

```sql
CREATE TABLE road_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,      -- Alternativa mostrada por defeito
  display_order INTEGER DEFAULT 0,
  distance_km NUMERIC(8,2),             -- pré-calculado
  elevation_gain INTEGER,               -- pré-calculado
  elevation_max INTEGER,                -- pré-calculado
  geometry_geojson JSONB,               -- merged geometry pré-calculado
  created_by UUID REFERENCES auth.users(id), -- null = curator
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Fase 11c — Tabela `alternative_segments`

```sql
CREATE TABLE alternative_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_id UUID REFERENCES road_alternatives(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  segment_order INTEGER NOT NULL,
  replaces_route_id UUID REFERENCES routes(id), -- segmento da base que este substitui
  UNIQUE(alternative_id, segment_order)
);
```

### Fase 11d — Campo `is_featured` nas routes

```sql
ALTER TABLE routes ADD COLUMN is_featured BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN highlight_note_pt TEXT; -- "O melhor começa em Braga"
ALTER TABLE routes ADD COLUMN highlight_note_en TEXT;
```

N103 Esposende→Braga: `is_featured = false` (está presente mas não é o foco)
N103 Braga→Chaves: `is_featured = true`

### Fase 11e — Tabela `geographic_areas`

```sql
CREATE TYPE geo_level AS ENUM (
  'continent', 'country', 'macro_region', 'historic_province',
  'natural_park', 'district', 'municipality'
);

CREATE TABLE geographic_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  level geo_level NOT NULL,
  parent_id UUID REFERENCES geographic_areas(id),
  geom GEOMETRY(MultiPolygon, 4326),       -- polígono real (CAOP/GADM/OSM)
  country_code TEXT,                        -- 'pt', 'es', etc.
  display_order INTEGER DEFAULT 0,
  description TEXT,
  hero_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON geographic_areas USING GIST(geom);
CREATE INDEX ON geographic_areas(parent_id);
CREATE INDEX ON geographic_areas(level);
CREATE INDEX ON geographic_areas(country_code);
```

### Fase 11f — Tabela `route_geographic_areas`

```sql
CREATE TABLE route_geographic_areas (
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  area_id UUID REFERENCES geographic_areas(id) ON DELETE CASCADE,
  is_auto BOOLEAN DEFAULT true,  -- true=calculado por ST_Intersects, false=manual
  PRIMARY KEY (route_id, area_id)
);
```

RPC PostgreSQL para popular automaticamente via:
```sql
INSERT INTO route_geographic_areas (route_id, area_id, is_auto)
SELECT r.id, g.id, true
FROM routes r, geographic_areas g
WHERE ST_Intersects(r.geometry, g.geom)
ON CONFLICT DO NOTHING;
```

### Ficheiros BD a alterar
- `scripts/schema.sql` — adicionar todas as novas tabelas
- `frontend/src/types/database.ts` — adicionar todos os novos tipos
- Migrations Supabase — aplicar via `apply_migration`

---

## Fase 12: Aquisição de Dados Geográficos

### Fontes

| Nível | Fonte | Formato | URL |
|-------|-------|---------|-----|
| Portugal Distritos + Concelhos | CAOP 2024.1 | GeoJSON | dados.gov.pt |
| Portugal Províncias Históricas | Manual (lookup municípios) | — | — |
| Portugal Parques Naturais | Overpass API | GeoJSON | overpass-turbo.eu |
| Espanha Comunidades Autónomas | GADM 4.1 | GeoJSON | gadm.org |
| Espanha Províncias | GADM 4.1 | GeoJSON | gadm.org |

### Pipeline de Importação (Python)

Novo script `scripts/import_geographic_areas.py`:
1. Download CAOP → parse → insert `geographic_areas` (districts, municipalities)
2. Overpass API query → parse → insert natural parks (Peneda-Gerês, Serra da Estrela, Serra do Alvão)
3. GADM Spain → parse → insert (Galícia, Catalunha, etc.)
4. Hierarquia manual (Portugal > Norte, Centro, Sul) → insert
5. Províncias históricas → mapping manual de concelhos → insert (aproximação via união de polígonos de concelhos)
6. Correr `route_geographic_areas` population via RPC

### Dados a criar manualmente
- Continentes (Europa, África, etc.) — apenas como anchor hierarchy
- Macro-regiões Portugal (Norte, Centro, Sul, Ilhas) — agregação de distritos
- Províncias históricas (Minho, Douro, Trás-os-Montes, Beira, Alentejo, Algarve) — aproximação por concelhos

---

## Fase 13: Frontend Redesign

### Mudanças na página Routes (`RoutesPage.tsx`)

**Estrutura actual**: lista de Routes base com sub-routes expandíveis

**Nova estrutura**:
- Sidebar esquerda: lista de **Roads** (não routes individuais)
- Cada Road mostra: nome, código (N222), badge com nº de alternativas, distância da alternativa default
- Clicar numa Road → mostra **selector de Alternativas** + detalhe + mapa
- Filtro geográfico: dropdown hierárquico no topo da sidebar ("Filtrar por área")

### Novo componente `RoadList.tsx`
- Exibe Roads com `is_featured` routes em destaque
- Badge "N alternativas" quando Road tem mais que 1 alternativa

### Novo componente `AlternativeSelector.tsx`
- Tabs ou dropdown com as Alternativas de uma Road
- Stats de cada alternativa (km, elevação)
- Mapa actualiza quando muda alternativa

### Mapa (`RouteMap.tsx`)
- Novo modo: "geographic context" — quando dentro de uma área geográfica, outros segmentos em dim (opacity 0.3)
- `fitBounds` usa bounds da alternativa seleccionada (não da route raw)
- Layer de fronteira geográfica quando user filtra por área

### Novos hooks
- `useRoads(lang)` — fetch roads com alternativas + default alternative
- `useGeographicAreas(parentId?)` — hierarquia navegável
- `useRoutesInArea(areaId)` — routes que intersectam uma área

---

## Faseamento de Implementação

### Sprint A: DB Schema + Dados (sem quebrar app actual)
1. Aplicar migrations novas (additive — não remove nada)
2. Popular tabela `roads` (N222, N304, N2, N103, Figueres-Cadaqués)
3. Criar alternativas da N222 (as 4 combinações)
4. Criar alternativas da N103 (Oficial + Melhor Troço)

### Sprint B: Frontend Roads + Alternativas
1. `useRoads` hook
2. `RoadList.tsx` + `AlternativeSelector.tsx`
3. Actualizar `RouteMap.tsx` para merged geometry das alternativas
4. GPX download = geometry da alternativa

### Sprint C: Dados Geográficos
1. Script Python para CAOP (distritos + concelhos PT)
2. Script Python para Overpass API (parques naturais)
3. Script Python para GADM (Espanha)
4. RPC para popular `route_geographic_areas` automaticamente

### Sprint D: Frontend Geográfico
1. Filtro geográfico na sidebar de Routes
2. `useGeographicAreas` hook
3. Breadcrumb de navegação (Portugal > Norte > Gerês)
4. Map rendering: troço contextual em dim + troço principal em destaque

---

## Ficheiros Críticos

| Ficheiro | Mudança |
|----------|---------|
| `scripts/schema.sql` | Novas tabelas: road_alternatives, alternative_segments, geographic_areas, route_geographic_areas; ALTER TABLE routes, roads |
| `scripts/import_geographic_areas.py` | Novo pipeline Python para dados geográficos |
| `frontend/src/types/database.ts` | Novos tipos TypeScript |
| `frontend/src/hooks/useRoutes.ts` | Adaptar para Roads + Alternativas |
| `frontend/src/hooks/useRoads.ts` | Novo hook |
| `frontend/src/hooks/useGeographicAreas.ts` | Novo hook |
| `frontend/src/pages/RoutesPage.tsx` | Restructurar para Roads + filtro geográfico |
| `frontend/src/components/Routes/RoadList.tsx` | Novo componente |
| `frontend/src/components/Routes/AlternativeSelector.tsx` | Novo componente |
| `frontend/src/components/Map/RouteMap.tsx` | Suporte a merged geometry + dim context layers |

---

## Verificação (end-to-end)

1. `npm run build` sem erros TypeScript
2. Abrir Chrome via MCP → navegar `/routes`
3. Ver lista de Roads (não routes individuais)
4. Seleccionar N222 → ver selector de Alternativas
5. Mudar para "N222 + Mesão Frio" → mapa actualiza + stats actualizados
6. Download GPX → verificar que o ficheiro contém a geometria merged
7. Filtrar por "Norte > Gerês" → ver só N304 troço Gerês
8. Fazer zoom out → ver restantes troços da N304 em dim
9. Navegar `/destinations` → destinations editoriais continuam funcionais

---

## Questões Abertas (a decidir durante implementação)

1. **Imagens hero**: Supabase Storage (1GB free tier) vs. URL externo — decidir quando chegarmos ao Sprint D
2. **User-created alternatives**: A coluna `created_by` está na tabela mas o UI curator-only por agora
3. **Províncias históricas**: Criação manual via união de polígonos de concelhos — precisam de validação cartográfica
4. **Concelhos ao longo de um percurso**: Detalhe contextual no RouteDetails (lista de concelhos por que passa) — Sprint B ou C
