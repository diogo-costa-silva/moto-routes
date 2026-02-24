---
name: coordinate-rules
description: Regras sobre coordenadas geográficas no projecto. Carrega automaticamente quando trabalhas com mapas, GPX, geometria, ou PostGIS.
user-invocable: false
---

# Regras de Coordenadas

## REGRA FUNDAMENTAL

**Sempre usar ordem: (longitude, latitude)**

```
CORRECTO: [-7.9134, 41.1404]  // lon, lat (Porto)
ERRADO:   [41.1404, -7.9134]  // lat, lon
```

## Porquê?

- **Mapbox GL JS** usa (lon, lat)
- **GeoJSON spec** usa (lon, lat)
- **PostGIS** usa (lon, lat)
- **Google Maps API** usa (lat, lon) - NÃO SEGUIR

## Verificação Rápida

Portugal está aproximadamente em:
- Longitude: -9 a -6 (valores negativos, oeste de Greenwich)
- Latitude: 37 a 42 (valores positivos)

Se vires coordenadas como `[41, -8]`, estão invertidas!
Deveria ser `[-8, 41]`.

## Exemplos por Contexto

### JavaScript/Mapbox
```javascript
map.flyTo({
  center: [-7.9134, 41.1404], // lon, lat
  zoom: 12
});

const geojson = {
  type: "Point",
  coordinates: [-7.9134, 41.1404] // lon, lat
};
```

### PostGIS
```sql
-- Criar ponto
ST_SetSRID(ST_MakePoint(-7.9134, 41.1404), 4326)

-- Converter de GeoJSON
ST_GeomFromGeoJSON('{"type":"Point","coordinates":[-7.9134,41.1404]}')
```

### Python (gpxpy)
```python
# gpxpy retorna na ordem correcta
point.longitude  # -7.9134
point.latitude   # 41.1404

# Ao criar GeoJSON
coordinates = [point.longitude, point.latitude]
```

## Debugging

Se rotas aparecem no lugar errado:
1. Verificar ordem das coordenadas
2. Primeiro valor deve ser negativo (longitude oeste)
3. Segundo valor deve ser ~40 (latitude Portugal)

## Lembrete Visual

```
     N (latitude +)
     │
W ───┼─── E
(-)  │  (+)
     │
     S (latitude -)

Portugal: longitude negativa, latitude positiva
Formato: [longitude, latitude] = [-X, +Y]
```
