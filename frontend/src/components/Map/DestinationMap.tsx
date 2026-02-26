import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'
import type { Destination, DestinationRoute } from '../../hooks/useDestinations'
import {
  addDestinationLayers,
  addDestinationSources,
  updateDestinationBBoxSource,
  updateDestinationRoutesSource,
} from './mapLayers'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

interface DestinationMapProps {
  destination: Destination | null
  featuredRoutes: DestinationRoute[]
  isMobile: boolean
  bottomPanelHeight?: number
}

function boundsFromRoutes(routes: DestinationRoute[]): mapboxgl.LngLatBounds | null {
  const coords = routes.flatMap((r) => {
    if (!r.geometry_geojson || r.geometry_geojson.type !== 'LineString') return []
    return r.geometry_geojson.coordinates as [number, number][]
  })
  if (coords.length === 0) return null
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return new mapboxgl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  )
}

function boundsFromPolygon(polygon: GeoJSON.Polygon): mapboxgl.LngLatBounds {
  const ring = polygon.coordinates[0] as [number, number][]
  const lons = ring.map((c) => c[0])
  const lats = ring.map((c) => c[1])
  return new mapboxgl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  )
}

export function DestinationMap({
  destination,
  featuredRoutes,
  isMobile,
  bottomPanelHeight,
}: DestinationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map once
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-7.5, 41.3],
      zoom: 8,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      addDestinationSources(map)
      addDestinationLayers(map)
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Fit to destination when selection or routes change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (!destination) {
      updateDestinationRoutesSource(map, [])
      updateDestinationBBoxSource(map, null)
      return
    }

    updateDestinationBBoxSource(map, destination.bounding_box_geojson)

    // Extend bounds to include both the bbox polygon and any featured routes
    const polyBounds = boundsFromPolygon(destination.bounding_box_geojson)
    const routeBounds = boundsFromRoutes(featuredRoutes)
    const bounds = routeBounds
      ? polyBounds.extend(routeBounds)
      : polyBounds
    const bottomPad = isMobile ? (bottomPanelHeight ?? window.innerHeight * 0.55) + 20 : 60

    map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
        : { top: 60, bottom: 60, left: 340, right: 60 },
      duration: 1200,
      maxZoom: 12,
    })
  }, [destination, featuredRoutes, mapReady, isMobile, bottomPanelHeight])

  // Update featured routes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateDestinationRoutesSource(map, featuredRoutes)
  }, [featuredRoutes, mapReady])

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
    </div>
  )
}
