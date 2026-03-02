import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useMapContext } from '../../contexts/MapContext'
import {
  addContextDimLayer,
  addContextDimSources,
  addDestinationLayers,
  addDestinationSources,
  addGeoBoundaryLayers,
  addGeoBoundarySources,
  addJourneyLayers,
  addJourneySources,
  addPOILayers,
  addPOISources,
  addRouteLayers,
  addRouteSources,
  addSubRouteLayers,
  addSubRouteSources,
  hideAllLayers,
} from './mapLayers'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

export function SharedMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { mapRef, setMapReady } = useMapContext()
  const { pathname } = useLocation()
  const isProfile = pathname === '/profile'

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
      // Add ALL sources and layers in correct render order.
      // All layers start with visibility:none (set in mapLayers.ts).
      // Sections toggle their own layers on mount/unmount.
      addGeoBoundarySources(map)
      addGeoBoundaryLayers(map)      // 1 — geo boundary (behind everything)
      addContextDimSources(map)
      addContextDimLayer(map)        // 2 — context dim segments
      addSubRouteSources(map)
      addSubRouteLayers(map)         // 3 — sub-routes / variants
      addRouteSources(map, [])
      addRouteLayers(map)            // 4 — routes base / hover / selected
      addPOISources(map)
      addPOILayers(map)              // 5 — POI circles and labels
      addJourneySources(map)
      addJourneyLayers(map)          // 6 — journey stages
      addDestinationSources(map)
      addDestinationLayers(map)      // 7 — destination fill / outline / routes

      // Map is ready — set ref and signal readiness to sections
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Hide all layers when on /profile — reduce GPU work, WebGL context stays alive.
  // Note: layers default to visibility:none at init, so /profile direct-landing is
  // automatically covered — no layers are visible before a section mounts.
  // This effect only fires when navigating TO /profile from a map section.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (isProfile) {
      hideAllLayers(map)
    }
    // When leaving /profile, sections will show their own layers on mount — no action needed here
  }, [isProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-red-400">
        <p>Missing VITE_MAPBOX_ACCESS_TOKEN in .env</p>
      </div>
    )
  }

  return (
    <div
      className={[
        'absolute inset-0',
        isProfile ? 'opacity-0 pointer-events-none' : '',
      ].join(' ')}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
