import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { Route } from '../../hooks/useRoutes'
import {
  LAYER_BASE,
  LAYER_HOVER,
  LAYER_SELECTED,
  SOURCE_ALL,
  SOURCE_SELECTED,
  addRouteLayers,
  addRouteSources,
  buildFeatureCollection,
} from './mapLayers'
import { RouteAnimation } from './RouteAnimation'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

interface RouteMapProps {
  routes: Route[]
  selectedRoute: Route | null
  hoveredRouteId: string | null
  onRouteClick: (route: Route) => void
  onRouteHover: (id: string | null) => void
}

export function RouteMap({
  routes,
  selectedRoute,
  hoveredRouteId,
  onRouteClick,
  onRouteHover,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [animating, setAnimating] = useState(false)

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
      addRouteSources(map, [])
      addRouteLayers(map)
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
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
      // mapRef.current is non-null here: we're inside an active map event listener
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

  // Update hover filter
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setFilter(LAYER_HOVER, ['==', ['get', 'id'], hoveredRouteId ?? ''])
  }, [hoveredRouteId, mapReady])

  // Handle route selection: update selected source + fly-to + trigger animation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const source = map.getSource(SOURCE_SELECTED) as mapboxgl.GeoJSONSource | undefined
    if (!source) return

    if (!selectedRoute) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    source.setData({
      type: 'Feature',
      properties: {},
      geometry: selectedRoute.geometry_geojson,
    })

    // Reset dasharray before animation
    map.setPaintProperty(LAYER_SELECTED, 'line-dasharray', [0, 2])

    map.flyTo({ center: selectedRoute.center, zoom: 11, duration: 1500 })
    map.once('moveend', () => setAnimating(true))
  }, [selectedRoute, mapReady])

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
      {animating && selectedRoute && mapRef.current && (
        <RouteAnimation
          map={mapRef.current}
          layerId={LAYER_SELECTED}
          onComplete={() => setAnimating(false)}
        />
      )}
    </div>
  )
}
