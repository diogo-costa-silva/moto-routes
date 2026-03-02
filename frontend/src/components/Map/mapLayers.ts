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
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
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
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
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
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
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
    layout: { 'visibility': 'none' },
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
      'visibility': 'none',
      'text-field': [
        'match',
        ['get', 'type'],
        'viewpoint', '👁',
        'restaurant', '🍽',
        'fuel_station', '⛽',
        'waterfall', '💧',
        'village', '🏘',
        'historical_site', '🏛',
        'highlight_start', '⭐',
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

// --- Sub-route helpers (extensions/variants of selected route) ---

export const SOURCE_SUB_ROUTES = 'sub-routes'
export const LAYER_SUB_ROUTES = 'sub-routes-line'

export function addSubRouteSources(map: MapboxMap): void {
  map.addSource(SOURCE_SUB_ROUTES, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addSubRouteLayers(map: MapboxMap): void {
  map.addLayer({
    id: LAYER_SUB_ROUTES,
    type: 'line',
    source: SOURCE_SUB_ROUTES,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#f97316',
      'line-width': 3,
      'line-opacity': 0.45,
      'line-dasharray': [4, 2],
    },
  })
}

export function updateSubRouteSource(map: MapboxMap, routes: Route[]): void {
  const source = map.getSource(SOURCE_SUB_ROUTES) as GeoJSONSource | undefined
  source?.setData(buildFeatureCollection(routes))
}

// Type alias re-export so RouteMap can get GeoJSONSource type from here
export type { GeoJSONSource }

// --- Context dim layer (non-active segments of the selected road) ---

export const SOURCE_CONTEXT_SEGMENTS = 'context-segments'
export const LAYER_CONTEXT_DIM = 'context-dim'

export function addContextDimSources(map: MapboxMap): void {
  map.addSource(SOURCE_CONTEXT_SEGMENTS, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addContextDimLayer(map: MapboxMap): void {
  map.addLayer({
    id: LAYER_CONTEXT_DIM,
    type: 'line',
    source: SOURCE_CONTEXT_SEGMENTS,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#7c2d12',
      'line-width': 3,
      'line-opacity': 0.4,
    },
  })
}

export function updateContextSegmentsSource(map: MapboxMap, routes: Route[]): void {
  const source = map.getSource(SOURCE_CONTEXT_SEGMENTS) as GeoJSONSource | undefined
  source?.setData(buildFeatureCollection(routes))
}

// --- Geographic boundary layer (selected geographic area) ---

export const SOURCE_GEO_BOUNDARY = 'geo-boundary'
export const LAYER_GEO_BOUNDARY_FILL = 'geo-boundary-fill'
export const LAYER_GEO_BOUNDARY_OUTLINE = 'geo-boundary-outline'

export function addGeoBoundarySources(map: MapboxMap): void {
  map.addSource(SOURCE_GEO_BOUNDARY, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addGeoBoundaryLayers(map: MapboxMap): void {
  map.addLayer({
    id: LAYER_GEO_BOUNDARY_FILL,
    type: 'fill',
    source: SOURCE_GEO_BOUNDARY,
    layout: { 'visibility': 'none' },
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.06,
    },
  })
  map.addLayer({
    id: LAYER_GEO_BOUNDARY_OUTLINE,
    type: 'line',
    source: SOURCE_GEO_BOUNDARY,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
      'line-opacity': 0.5,
      'line-dasharray': [6, 3],
    },
  })
}

export function updateGeoBoundarySource(
  map: MapboxMap,
  multipolygon: GeoJSON.MultiPolygon | null,
): void {
  const source = map.getSource(SOURCE_GEO_BOUNDARY) as GeoJSONSource | undefined
  if (!source) return
  if (!multipolygon) {
    source.setData({ type: 'FeatureCollection', features: [] })
  } else {
    source.setData({ type: 'Feature', properties: {}, geometry: multipolygon })
  }
}

// --- Journey helpers ---

export const SOURCE_JOURNEY_STAGES = 'journey-stages'
export const LAYER_JOURNEY_STAGES = 'journey-stages-line'
export const LAYER_JOURNEY_STAGE_HOVER = 'journey-stage-hover'
export const SOURCE_JOURNEY_SELECTED = 'journey-stage-selected'
export const LAYER_JOURNEY_SELECTED = 'journey-stage-selected'
export const STAGE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']

export interface StageFeatureProps {
  stage_id: string
  stage_order: number
}

export function buildStagesFeatureCollection(
  stages: Array<{ id: string; stage_order: number; route: { geometry_geojson: GeoJSON.LineString } }>,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stages.map((s) => ({
      type: 'Feature',
      properties: { stage_id: s.id, stage_order: s.stage_order },
      geometry: s.route.geometry_geojson,
    })),
  }
}

export function addJourneySources(map: MapboxMap): void {
  map.addSource(SOURCE_JOURNEY_STAGES, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
  map.addSource(SOURCE_JOURNEY_SELECTED, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addJourneyLayers(map: MapboxMap): void {
  map.addLayer({
    id: LAYER_JOURNEY_STAGES,
    type: 'line',
    source: SOURCE_JOURNEY_STAGES,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': [
        'match',
        ['get', 'stage_order'],
        1, STAGE_COLORS[0],
        2, STAGE_COLORS[1],
        3, STAGE_COLORS[2],
        4, STAGE_COLORS[3],
        5, STAGE_COLORS[4],
        '#6b7280',
      ] as unknown as string,
      'line-width': 3,
      'line-opacity': 0.85,
    },
  })

  // Hover highlight
  map.addLayer({
    id: LAYER_JOURNEY_STAGE_HOVER,
    type: 'line',
    source: SOURCE_JOURNEY_STAGES,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    filter: ['==', ['get', 'stage_id'], ''],
    paint: {
      'line-color': '#ffffff',
      'line-width': 5,
      'line-opacity': 0.4,
    },
  })

  // Selected stage (animated)
  map.addLayer({
    id: LAYER_JOURNEY_SELECTED,
    type: 'line',
    source: SOURCE_JOURNEY_SELECTED,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#ffffff',
      'line-width': 5,
      'line-dasharray': [0, 2],
      'line-opacity': 0.9,
    },
  })
}

export function updateJourneyStagesSource(
  map: MapboxMap,
  stages: Array<{ id: string; stage_order: number; route: { geometry_geojson: GeoJSON.LineString } }>,
): void {
  const source = map.getSource(SOURCE_JOURNEY_STAGES) as GeoJSONSource | undefined
  source?.setData(buildStagesFeatureCollection(stages))
}

// --- Destination helpers ---

export const SOURCE_DESTINATION_BBOX = 'destination-bbox'
export const LAYER_DESTINATION_FILL = 'destination-fill'
export const LAYER_DESTINATION_OUTLINE = 'destination-outline'
export const SOURCE_DESTINATION_ROUTES = 'destination-routes'
export const LAYER_DESTINATION_ROUTES = 'destination-routes-line'

export function addDestinationSources(map: MapboxMap): void {
  map.addSource(SOURCE_DESTINATION_BBOX, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
  map.addSource(SOURCE_DESTINATION_ROUTES, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
}

export function addDestinationLayers(map: MapboxMap): void {
  // Amber fill for destination bounding box polygon
  map.addLayer({
    id: LAYER_DESTINATION_FILL,
    type: 'fill',
    source: SOURCE_DESTINATION_BBOX,
    layout: { 'visibility': 'none' },
    paint: {
      'fill-color': '#f59e0b',
      'fill-opacity': 0.2,
    },
  })

  // Dashed amber outline for bounding box
  map.addLayer({
    id: LAYER_DESTINATION_OUTLINE,
    type: 'line',
    source: SOURCE_DESTINATION_BBOX,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#f59e0b',
      'line-width': 3,
      'line-opacity': 0.85,
      'line-dasharray': [6, 3],
    },
  })

  // Orange solid lines for featured routes
  map.addLayer({
    id: LAYER_DESTINATION_ROUTES,
    type: 'line',
    source: SOURCE_DESTINATION_ROUTES,
    layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' },
    paint: {
      'line-color': '#f97316',
      'line-width': 3,
      'line-opacity': 0.9,
    },
  })
}

export function updateDestinationBBoxSource(map: MapboxMap, polygon: GeoJSON.Polygon | null): void {
  const source = map.getSource(SOURCE_DESTINATION_BBOX) as GeoJSONSource | undefined
  if (!source) return
  if (!polygon) {
    source.setData({ type: 'FeatureCollection', features: [] })
  } else {
    source.setData({ type: 'Feature', properties: {}, geometry: polygon })
  }
}

export function updateDestinationRoutesSource(
  map: MapboxMap,
  routes: Array<{ id: string; name: string; geometry_geojson: GeoJSON.LineString }>,
): void {
  const source = map.getSource(SOURCE_DESTINATION_ROUTES) as GeoJSONSource | undefined
  if (!source) return
  source.setData({
    type: 'FeatureCollection',
    features: routes.map((r) => ({
      type: 'Feature',
      properties: { id: r.id, name: r.name },
      geometry: r.geometry_geojson,
    })),
  })
}

export function updateJourneySelectedSource(
  map: MapboxMap,
  geometry: GeoJSON.LineString | null,
): void {
  const source = map.getSource(SOURCE_JOURNEY_SELECTED) as GeoJSONSource | undefined
  if (!source) return
  if (!geometry) {
    source.setData({ type: 'FeatureCollection', features: [] })
  } else {
    source.setData({ type: 'Feature', properties: {}, geometry })
  }
}

// --- Layer group constants for section visibility management ---

export const ROUTES_LAYERS = [
  LAYER_GEO_BOUNDARY_FILL,
  LAYER_GEO_BOUNDARY_OUTLINE,
  LAYER_CONTEXT_DIM,
  LAYER_SUB_ROUTES,
  LAYER_BASE,
  LAYER_HOVER,
  LAYER_SELECTED,
  LAYER_POI_CIRCLES,
  LAYER_POI_LABELS,
] as const

export const JOURNEY_LAYERS = [
  LAYER_JOURNEY_STAGES,
  LAYER_JOURNEY_STAGE_HOVER,
  LAYER_JOURNEY_SELECTED,
] as const

export const DESTINATION_LAYERS = [
  LAYER_DESTINATION_FILL,
  LAYER_DESTINATION_OUTLINE,
  LAYER_DESTINATION_ROUTES,
] as const

export const ALL_LAYERS = [
  ...ROUTES_LAYERS,
  ...JOURNEY_LAYERS,
  ...DESTINATION_LAYERS,
] as const

// --- Visibility helpers ---

export function showLayers(map: MapboxMap, layerIds: readonly string[]): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible')
  }
}

export function hideLayers(map: MapboxMap, layerIds: readonly string[]): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
  }
}

export function hideAllLayers(map: MapboxMap): void {
  hideLayers(map, ALL_LAYERS)
}
