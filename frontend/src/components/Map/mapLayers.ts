import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { Route } from '../../hooks/useRoutes'

export const SOURCE_ALL = 'routes-all'
export const SOURCE_SELECTED = 'route-selected'
export const LAYER_BASE = 'routes-base'
export const LAYER_HOVER = 'routes-hover'
export const LAYER_SELECTED = 'route-selected'

export function buildFeatureCollection(routes: Route[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes.map((r) => ({
      type: 'Feature',
      id: r.id,
      properties: { id: r.id, name: r.name },
      geometry: r.geometry_geojson,
    })),
  }
}

export function addRouteSources(map: MapboxMap, routes: Route[]): void {
  map.addSource(SOURCE_ALL, {
    type: 'geojson',
    data: buildFeatureCollection(routes),
  })

  map.addSource(SOURCE_SELECTED, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addRouteLayers(map: MapboxMap): void {
  // Base: all routes in grey
  map.addLayer({
    id: LAYER_BASE,
    type: 'line',
    source: SOURCE_ALL,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#6b7280',
      'line-width': 2,
      'line-opacity': 0.7,
    },
  })

  // Hover: highlighted route (filter applied dynamically)
  map.addLayer({
    id: LAYER_HOVER,
    type: 'line',
    source: SOURCE_ALL,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'line-color': '#f97316',
      'line-width': 4,
      'line-opacity': 0.9,
    },
  })

  // Selected: animated orange line on separate source
  map.addLayer({
    id: LAYER_SELECTED,
    type: 'line',
    source: SOURCE_SELECTED,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#f97316',
      'line-width': 5,
      'line-dasharray': [0, 2],
    },
  })
}

// Type alias re-export so RouteMap can get GeoJSONSource type from here
export type { GeoJSONSource }
