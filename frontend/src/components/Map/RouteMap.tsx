import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RoutePOI } from '../../hooks/useRoutePOIs'
import type { Route } from '../../hooks/useRoutes'
import type { RoadAlternative } from '../../types/database'
import {
  LAYER_BASE,
  LAYER_HOVER,
  LAYER_POI_CIRCLES,
  LAYER_SELECTED,
  SOURCE_ALL,
  SOURCE_SELECTED,
  addContextDimLayer,
  addContextDimSources,
  addGeoBoundaryLayers,
  addGeoBoundarySources,
  addPOILayers,
  addPOISources,
  addRouteLayers,
  addRouteSources,
  addSubRouteLayers,
  addSubRouteSources,
  buildFeatureCollection,
  updateContextSegmentsSource,
  updateGeoBoundarySource,
  updatePOISource,
  updateSubRouteSource,
} from './mapLayers'
import { RouteAnimation } from './RouteAnimation'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

const ASSOCIATION_COLOUR: Record<string, string> = {
  on_route: '#f97316',
  near_route: '#facc15',
  detour: '#a78bfa',
}

const TYPE_EMOJI: Record<string, string> = {
  viewpoint: '👁',
  restaurant: '🍽',
  fuel_station: '⛽',
  waterfall: '💧',
  village: '🏘',
  historical_site: '🏛',
}

interface RouteMapProps {
  routes: Route[]
  selectedRoute: Route | null
  hoveredRouteId: string | null
  isMobile: boolean
  bottomPanelHeight?: number
  onRouteClick: (route: Route) => void
  onRouteHover: (id: string | null) => void
  pois: RoutePOI[]
  onPOIClick: (poi: RoutePOI) => void
  subRoutes?: Route[]
  selectedAlternative?: RoadAlternative | null
  contextSegments?: Route[]
  geoBoundary?: GeoJSON.MultiPolygon | null
}

export function RouteMap({
  routes,
  selectedRoute,
  hoveredRouteId,
  isMobile,
  bottomPanelHeight,
  onRouteClick,
  onRouteHover,
  pois,
  onPOIClick,
  subRoutes = [],
  selectedAlternative = null,
  contextSegments = [],
  geoBoundary = null,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [animating, setAnimating] = useState(false)

  // Stable callback — avoids restarting the RAF animation on every parent re-render
  const handleAnimationComplete = useCallback(() => setAnimating(false), [])

  // Reset animation when selection changes
  useEffect(() => {
    setAnimating(false)
  }, [selectedRoute?.id])

  // Initialize map once
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-7.9, 41.0],
      zoom: 7,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      addGeoBoundarySources(map)
      addGeoBoundaryLayers(map)
      addRouteSources(map, [])
      addRouteLayers(map)
      addSubRouteSources(map)
      addSubRouteLayers(map)
      addContextDimSources(map)
      addContextDimLayer(map)
      addPOISources(map)
      addPOILayers(map)
      setMapInstance(map)
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setMapInstance(null)
      setMapReady(false)
    }
  }, [])

  // Update base source when routes load
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || routes.length === 0) return

    const source = map.getSource(SOURCE_ALL) as mapboxgl.GeoJSONSource | undefined
    source?.setData(buildFeatureCollection(routes))
  }, [routes, mapReady])

  // Sync sub-routes source (extensions/variants of selected route)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateSubRouteSource(map, subRoutes)
  }, [subRoutes, mapReady])

  // Sync context dim segments (non-active routes of the same road)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateContextSegmentsSource(map, contextSegments)
  }, [contextSegments, mapReady])

  // Sync geographic boundary
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateGeoBoundarySource(map, geoBoundary ?? null)
  }, [geoBoundary, mapReady])

  // Sync POI source when pois list changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updatePOISource(map, pois)
    // Close any open popup when POIs change (route change)
    popupRef.current?.remove()
    popupRef.current = null
  }, [pois, mapReady])

  // Attach click and hover events when map + routes are ready
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    function onClick(e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) {
      const feature = e.features?.[0]
      if (!feature) return
      const id = feature.properties?.id as string | undefined
      if (!id) return
      const route = routes.find((r) => r.id === id)
      if (route) onRouteClick(route)
    }

    function onMouseMove(
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) {
      mapRef.current!.getCanvas().style.cursor = 'pointer'
      const id = e.features?.[0]?.properties?.id as string | undefined
      onRouteHover(id ?? null)
    }

    function onMouseLeave() {
      mapRef.current!.getCanvas().style.cursor = ''
      onRouteHover(null)
    }

    map.on('click', LAYER_BASE, onClick)
    map.on('mousemove', LAYER_BASE, onMouseMove)
    map.on('mouseleave', LAYER_BASE, onMouseLeave)

    return () => {
      map.off('click', LAYER_BASE, onClick)
      map.off('mousemove', LAYER_BASE, onMouseMove)
      map.off('mouseleave', LAYER_BASE, onMouseLeave)
    }
  }, [mapReady, routes, onRouteClick, onRouteHover])

  // POI click and hover events
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    function onPOIClickHandler(
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) {
      const feature = e.features?.[0]
      if (!feature) return

      const props = feature.properties as {
        id: string
        name: string
        type: string
        description: string
        association_type: string
        km_marker: number | null
      } | null
      if (!props) return

      const poi = pois.find((p) => p.id === props.id)
      if (poi) onPOIClick(poi)

      // Show popup at click location
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const colour = ASSOCIATION_COLOUR[props.association_type] ?? '#6b7280'
      const emoji = TYPE_EMOJI[props.type] ?? '📍'
      const assocLabel =
        props.association_type === 'on_route'
          ? 'On route'
          : props.association_type === 'near_route'
            ? 'Nearby'
            : 'Detour'

      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

      popupRef.current?.remove()
      popupRef.current = new mapboxgl.Popup({ closeButton: false, maxWidth: '260px', className: 'dark-popup' })
        .setLngLat(coords)
        .setHTML(
          `<div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="font-size:18px">${emoji}</span>
              <strong style="font-size:14px">${esc(props.name)}</strong>
            </div>
            <span style="display:inline-block;background:${colour}22;color:${colour};border:1px solid ${colour}55;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;margin-bottom:${props.description ? '6px' : '0'}">${assocLabel}</span>
            ${props.description ? `<p style="margin:0;font-size:12px;opacity:0.7;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${esc(props.description)}</p>` : ''}
          </div>`,
        )
        .addTo(mapRef.current!)
    }

    function onPOIMouseEnter() {
      mapRef.current!.getCanvas().style.cursor = 'pointer'
    }

    function onPOIMouseLeave() {
      mapRef.current!.getCanvas().style.cursor = ''
    }

    map.on('click', LAYER_POI_CIRCLES, onPOIClickHandler)
    map.on('mouseenter', LAYER_POI_CIRCLES, onPOIMouseEnter)
    map.on('mouseleave', LAYER_POI_CIRCLES, onPOIMouseLeave)

    return () => {
      map.off('click', LAYER_POI_CIRCLES, onPOIClickHandler)
      map.off('mouseenter', LAYER_POI_CIRCLES, onPOIMouseEnter)
      map.off('mouseleave', LAYER_POI_CIRCLES, onPOIMouseLeave)
    }
  }, [mapReady, pois, onPOIClick])

  // Update hover filter
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setFilter(LAYER_HOVER, ['==', ['get', 'id'], hoveredRouteId ?? ''])
  }, [hoveredRouteId, mapReady])

  // Handle route/alternative selection: update selected source + fit-to-bounds + trigger animation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const source = map.getSource(SOURCE_SELECTED) as mapboxgl.GeoJSONSource | undefined
    if (!source) return

    // Use alternative geometry if available, otherwise route geometry; clear if neither
    const altGeom = selectedAlternative?.geometry_geojson
    const geometry = altGeom ?? selectedRoute?.geometry_geojson

    if (!geometry) {
      source.setData({ type: 'FeatureCollection', features: [] })
      map.flyTo({ center: [-7.9, 41.0], zoom: 7, duration: 1000 })
      return
    }

    source.setData({ type: 'Feature', properties: {}, geometry: geometry as GeoJSON.Geometry })

    // Reset dasharray before animation
    map.setPaintProperty(LAYER_SELECTED, 'line-dasharray', [0, 2])

    // Compute bounds — handle LineString and MultiLineString
    let allCoords: [number, number][] = []
    if (geometry.type === 'LineString') {
      allCoords = geometry.coordinates as [number, number][]
    } else if (geometry.type === 'MultiLineString') {
      allCoords = (geometry.coordinates as [number, number][][]).flat()
    } else if (selectedRoute) {
      allCoords = selectedRoute.geometry_geojson.coordinates as [number, number][]
    }

    if (allCoords.length === 0) return

    const lons = allCoords.map(c => c[0])
    const lats = allCoords.map(c => c[1])
    const bounds = new mapboxgl.LngLatBounds(
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    )

    const bottomPad = isMobile ? (bottomPanelHeight ?? window.innerHeight * 0.55) + 20 : 60
    const padding = isMobile
      ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
      : { top: 60, bottom: 60, left: 320, right: 60 }

    map.fitBounds(bounds, { padding, duration: 1000, maxZoom: 13 })
    map.once('moveend', () => setAnimating(true))
  }, [selectedRoute, selectedAlternative, mapReady, isMobile, bottomPanelHeight])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-950 text-red-400">
        <p>Missing VITE_MAPBOX_ACCESS_TOKEN in .env</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {animating && selectedRoute && mapInstance && (
        <RouteAnimation
          map={mapInstance}
          layerId={LAYER_SELECTED}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}
