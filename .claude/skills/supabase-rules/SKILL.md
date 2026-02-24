---
name: supabase-rules
description: Padrões e convenções para Supabase e PostGIS no projecto Moto Routes
auto_invoke:
  when: "working with database queries, Supabase client, RLS policies, PostGIS, or database-related code"
---

# Regras Supabase + PostGIS

## Coordenadas

**Ver `/coordinate-rules` para regras completas de coordenadas.**

Resumo: Sempre `(longitude, latitude)` - longitude primeiro!

---

## Queries Supabase

### Selecção de Campos (nunca usar *)
```typescript
// CORRECTO
const { data } = await supabase
  .from('routes')
  .select('id, name, distance_km, geometry_geojson')

// EVITAR - traz dados desnecessários
const { data } = await supabase
  .from('routes')
  .select('*')
```

### Single vs Array
```typescript
// Quando esperas 1 resultado
const { data } = await supabase
  .from('routes')
  .select('*')
  .eq('id', routeId)
  .single() // Retorna objecto, não array

// Quando esperas vários
const { data } = await supabase
  .from('routes')
  .select('*')
  .eq('country', 'PT') // Retorna array
```

### Tratamento de Erros (SEMPRE)
```typescript
const { data, error } = await supabase
  .from('routes')
  .select('*')

if (error) {
  console.error('Erro ao buscar rotas:', error)
  throw error
}

// Só usar data depois de verificar erro
```

---

## PostGIS

### Geometria de Rotas
```sql
-- Tipo de coluna
geometry(LineString, 4326)

-- Criar índice espacial
CREATE INDEX routes_geometry_idx ON routes USING GIST (geometry);
```

### Converter para GeoJSON
```sql
-- Na query
SELECT
  id,
  name,
  ST_AsGeoJSON(geometry)::json as geometry_geojson
FROM routes
```

### Calcular Distância Real (em metros)
```sql
-- Usar ::geography para distância geodésica
SELECT ST_Length(geometry::geography) as distance_meters
FROM routes
WHERE id = $1

-- Para km
SELECT ST_Length(geometry::geography) / 1000 as distance_km
```

### Encontrar POIs Perto de Rota
```sql
SELECT p.*
FROM pois p, routes r
WHERE r.id = $1
  AND ST_DWithin(
    p.location::geography,
    r.geometry::geography,
    500  -- metros
  )
```

### Bounding Box
```sql
SELECT ST_Extent(geometry) as bbox
FROM routes
WHERE id = $1

-- Resultado: BOX(-8.7 41.0, -8.5 41.3)
```

---

## Tipos TypeScript

### Gerar Tipos
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Usar Tipos
```typescript
import { Database } from '@/types/database'

type Route = Database['public']['Tables']['routes']['Row']
type RouteInsert = Database['public']['Tables']['routes']['Insert']
```

---

## RLS (Row Level Security)

### Tabelas Públicas (leitura)
```sql
-- routes, journeys, destinations, pois
CREATE POLICY "Public read access"
ON routes FOR SELECT
TO public
USING (true);
```

### Tabelas de Utilizador
```sql
-- user_favorites
CREATE POLICY "Users can read own favorites"
ON user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

## Inserir Dados com Geometria

### Rota com LineString
```typescript
const routeData = {
  name: 'N222 - Vale do Douro',
  geometry: `SRID=4326;LINESTRING(${coordinates.map(c => `${c[0]} ${c[1]}`).join(',')})`
}

// Ou com GeoJSON
const routeData = {
  name: 'N222 - Vale do Douro',
  geometry: JSON.stringify({
    type: 'LineString',
    coordinates: coordinates // [[lon, lat], [lon, lat], ...]
  })
}
```

---

## Cache de GeoJSON

### Padrão do Projecto
- Coluna `geometry`: PostGIS nativo (para queries espaciais)
- Coluna `geometry_geojson`: JSON pré-calculado (para frontend)

```sql
-- Trigger para actualizar cache
CREATE OR REPLACE FUNCTION update_geojson_cache()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geometry_geojson = ST_AsGeoJSON(NEW.geometry)::json;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_geojson_cache
BEFORE INSERT OR UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION update_geojson_cache();
```

---

## Performance

### Índices Essenciais
```sql
-- Espacial
CREATE INDEX ON routes USING GIST (geometry);
CREATE INDEX ON pois USING GIST (location);

-- Chaves estrangeiras
CREATE INDEX ON journey_stages (journey_id);
CREATE INDEX ON journey_stages (route_id);
CREATE INDEX ON route_pois (route_id);
CREATE INDEX ON route_pois (poi_id);
```

### Paginação
```typescript
const { data } = await supabase
  .from('routes')
  .select('*')
  .range(0, 9) // Primeiros 10
  .order('name')
```
