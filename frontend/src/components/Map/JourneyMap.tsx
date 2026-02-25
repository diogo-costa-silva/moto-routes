import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { JourneyStage } from '../../hooks/useJourneys'
import {
  LAYER_JOURNEY_SELECTED,
  LAYER_JOURNEY_STAGE_HOVER,
  LAYER_JOURNEY_STAGES,
  STAGE_COLORS,
  addJourneyLayers,
  addJourneySources,
  updateJourneySelectedSource,
  updateJourneyStagesSource,
} from './mapLayers'
import { RouteAnimation } from './RouteAnimation'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

interface JourneyMapProps {
  stages: JourneyStage[]
  selectedStage: JourneyStage | null
  isMobile: boolean
  bottomPanelHeight?: number
  onStageClick: (stage: JourneyStage) => void
}

function boundsFromStages(stages: JourneyStage[]): mapboxgl.LngLatBounds | null {
  if (stages.length === 0) return null
  const allCoords = stages.flatMap((s) => s.route.geometry_geojson.coordinates as [number, number][])
  if (allCoords.length === 0) return null
  const lons = allCoords.map((c) => c[0])
  const lats = allCoords.map((c) => c[1])
  return new mapboxgl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  )
}

function boundsFromCoords(coords: [number, number][]): mapboxgl.LngLatBounds | null {
  if (coords.length === 0) return null
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return new mapboxgl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  )
}

export function JourneyMap({
  stages,
  selectedStage,
  isMobile,
  bottomPanelHeight,
  onStageClick,
}: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleAnimationComplete = useCallback(() => setAnimating(false), [])

  useEffect(() => {
    setAnimating(false)
  }, [selectedStage?.id])

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
      addJourneySources(map)
      addJourneyLayers(map)
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Update stages source + fit to all stages
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateJourneyStagesSource(map, stages)

    if (stages.length === 0) return

    const bounds = boundsFromStages(stages)
    if (!bounds) return

    const bottomPad = isMobile ? (bottomPanelHeight ?? window.innerHeight * 0.5) + 20 : 60
    map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
        : { top: 60, bottom: 60, left: 40, right: 60 },
      duration: 1200,
      maxZoom: 12,
    })
  }, [stages, mapReady, isMobile, bottomPanelHeight])

  // Update selected stage source + fit + animate
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (!selectedStage) {
      updateJourneySelectedSource(map, null)
      if (map.getLayer(LAYER_JOURNEY_SELECTED)) {
        map.setPaintProperty(LAYER_JOURNEY_SELECTED, 'line-dasharray', [0, 2])
        map.setPaintProperty(LAYER_JOURNEY_SELECTED, 'line-color', '#ffffff')
      }
      return
    }

    updateJourneySelectedSource(map, selectedStage.route.geometry_geojson)
    map.setPaintProperty(LAYER_JOURNEY_SELECTED, 'line-dasharray', [0, 2])
    // Match animation colour to the stage dot colour
    const stageColor = STAGE_COLORS[(selectedStage.stage_order - 1) % STAGE_COLORS.length]
    map.setPaintProperty(LAYER_JOURNEY_SELECTED, 'line-color', stageColor)

    const coords = selectedStage.route.geometry_geojson.coordinates as [number, number][]
    const bounds = boundsFromCoords(coords)
    if (!bounds) return

    const bottomPad = isMobile ? (bottomPanelHeight ?? window.innerHeight * 0.5) + 20 : 60
    map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
        : { top: 60, bottom: 60, left: 40, right: 60 },
      duration: 1500,
      maxZoom: 13,
    })
    map.once('moveend', () => setAnimating(true))
  }, [selectedStage, mapReady, isMobile, bottomPanelHeight])

  // Click + hover events on stages layer
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    function onClick(e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) {
      const feature = e.features?.[0]
      if (!feature) return
      const stageId = feature.properties?.stage_id as string | undefined
      if (!stageId) return
      const stage = stages.find((s) => s.id === stageId)
      if (stage) onStageClick(stage)
    }

    function onMouseMove(
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ) {
      mapRef.current!.getCanvas().style.cursor = 'pointer'
      const stageId = e.features?.[0]?.properties?.stage_id as string | undefined
      if (mapRef.current!.getLayer(LAYER_JOURNEY_STAGE_HOVER)) {
        mapRef.current!.setFilter(LAYER_JOURNEY_STAGE_HOVER, ['==', ['get', 'stage_id'], stageId ?? ''])
      }
    }

    function onMouseLeave() {
      mapRef.current!.getCanvas().style.cursor = ''
      if (mapRef.current!.getLayer(LAYER_JOURNEY_STAGE_HOVER)) {
        mapRef.current!.setFilter(LAYER_JOURNEY_STAGE_HOVER, ['==', ['get', 'stage_id'], ''])
      }
    }

    map.on('click', LAYER_JOURNEY_STAGES, onClick)
    map.on('mousemove', LAYER_JOURNEY_STAGES, onMouseMove)
    map.on('mouseleave', LAYER_JOURNEY_STAGES, onMouseLeave)

    return () => {
      map.off('click', LAYER_JOURNEY_STAGES, onClick)
      map.off('mousemove', LAYER_JOURNEY_STAGES, onMouseMove)
      map.off('mouseleave', LAYER_JOURNEY_STAGES, onMouseLeave)
    }
  }, [mapReady, stages, onStageClick])

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
      {animating && selectedStage && mapRef.current && (
        <RouteAnimation
          map={mapRef.current}
          layerId={LAYER_JOURNEY_SELECTED}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}
