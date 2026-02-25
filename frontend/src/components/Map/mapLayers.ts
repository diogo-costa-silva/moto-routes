import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { Route } from '../../hooks/useRoutes'
import type { RoutePOI } from '../../hooks/useRoutePOIs'

export const SOURCE_ALL = 'routes-all'
export const SOURCE_SELECTED = 'route-selected'
export const LAYER_BASE = 'routes-base'
export const LAYER_HOVER = 'routes-hover'
export const LAYER_SELECTED = 'route-selected'

export const SOURCE_POIS = 'pois'
export const LAYER_POI_CIRCLES = 'poi-circles'
export const LAYER_POI_LABELS = 'poi-labels'

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
      'line-color': '#fb923c',
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

// --- POI helpers ---

export function buildPOIFeatureCollection(pois: RoutePOI[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pois.map((poi) => ({
      type: 'Feature',
      properties: {
        id: poi.id,
        name: poi.name,
        type: poi.type,
        description: poi.description ?? '',
        association_type: poi.association_type,
        km_marker: poi.km_marker,
      },
      geometry: {
        type: 'Point',
        coordinates: [poi.longitude, poi.latitude],
      },
    })),
  }
}

export function addPOISources(map: MapboxMap): void {
  map.addSource(SOURCE_POIS, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addPOILayers(map: MapboxMap): void {
  // Circle marker per POI, coloured by association_type
  map.addLayer({
    id: LAYER_POI_CIRCLES,
    type: 'circle',
    source: SOURCE_POIS,
    paint: {
      'circle-radius': 10,
      'circle-color': [
        'match',
        ['get', 'association_type'],
        'on_route', '#f97316',
        'near_route', '#facc15',
        'detour', '#a78bfa',
        '#6b7280', // fallback
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  })

  // Emoji label per POI type
  map.addLayer({
    id: LAYER_POI_LABELS,
    type: 'symbol',
    source: SOURCE_POIS,
    layout: {
      'text-field': [
        'match',
        ['get', 'type'],
        'viewpoint', '👁',
        'restaurant', '🍽',
        'fuel_station', '⛽',
        'waterfall', '💧',
        'village', '🏘',
        'historical_site', '🏛',
        '📍', // fallback
      ],
      'text-size': 12,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
  })
}

export function updatePOISource(map: MapboxMap, pois: RoutePOI[]): void {
  const source = map.getSource(SOURCE_POIS) as GeoJSONSource | undefined
  source?.setData(buildPOIFeatureCollection(pois))
}

// Type alias re-export so RouteMap can get GeoJSONSource type from here
export type { GeoJSONSource }
