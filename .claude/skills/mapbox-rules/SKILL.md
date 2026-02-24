---
name: mapbox-rules
description: Padrões e convenções para Mapbox GL JS no projecto Moto Routes
auto_invoke:
  when: "working with map components, layers, animations, Mapbox GL JS, or map-related React components"
---

# Regras Mapbox GL JS

## Coordenadas

**Ver `/coordinate-rules` para regras completas de coordenadas.**

Resumo: Sempre `[longitude, latitude]` - longitude primeiro!

---

## Animação de Rotas

### Desenho Progressivo (line-dasharray)

```javascript
// Configuração da layer
map.addLayer({
  id: 'route-line',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#3b82f6',
    'line-width': 4,
    'line-dasharray': [0, 4] // Começa invisível
  }
});

// Animação
function animateRoute(timestamp) {
  const progress = (timestamp % duration) / duration;
  map.setPaintProperty('route-line', 'line-dasharray', [
    progress * 4, // Parte visível
    4 - progress * 4 // Parte invisível
  ]);
  requestAnimationFrame(animateRoute);
}
```

### Durações Recomendadas
- Rotas curtas (<50km): 2-3 segundos
- Rotas médias (50-200km): 3-4 segundos
- Rotas longas (>200km): 5-6 segundos

### Easing
- Usar `ease-in-out` para transições suaves
- Evitar `linear` (parece mecânico)

---

## Layers

### Ordem de Layers (baixo para cima)
1. `background` - Mapa base
2. `route-*` - Linhas de rotas
3. `poi-*` - Marcadores de POIs
4. `labels` - Texto/labels

### Nomenclatura de IDs
```javascript
`route-${routeId}-line`      // Linha da rota
`route-${routeId}-outline`   // Contorno (se usado)
`poi-${poiId}-marker`        // Marcador de POI
```

---

## Fly-to

### Configuração Padrão
```javascript
map.flyTo({
  center: [longitude, latitude],
  zoom: 12,
  duration: 1500, // 1.5 segundos
  essential: true,
  padding: {
    top: 100,
    bottom: 300, // Espaço para bottom sheet mobile
    left: 50,
    right: 50
  }
});
```

### Para Bounds (mostrar rota inteira)
```javascript
map.fitBounds(bounds, {
  padding: { top: 100, bottom: 300, left: 50, right: 50 },
  duration: 1500
});
```

---

## Eventos

### Hover (usar mouseenter/mouseleave)
```javascript
// CORRECTO
map.on('mouseenter', 'route-line', () => { /* ... */ });
map.on('mouseleave', 'route-line', () => { /* ... */ });

// EVITAR - dispara múltiplas vezes
map.on('mouseover', 'route-line', () => { /* ... */ });
```

### Click com Precisão
```javascript
map.on('click', 'route-line', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['route-line']
  });
  if (features.length > 0) {
    // Processar feature
  }
});
```

---

## Mobile-First

### Bottom Sheet
- Deixar espaço inferior para bottom sheet (padding-bottom: 300px)
- Controlos do mapa no topo ou laterais
- Botões com tamanho mínimo 44x44px

### Gestos
- Permitir zoom com pinch
- Desactivar rotate se não necessário
- Considerar `dragPan` em mobile

---

## Performance

### Simplificar Geometrias
- Para zoom out, usar geometrias simplificadas
- ST_Simplify no PostGIS antes de enviar

### Clustering para POIs
```javascript
map.addSource('pois', {
  type: 'geojson',
  data: poisData,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});
```
