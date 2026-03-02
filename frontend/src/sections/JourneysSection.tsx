import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import mapboxgl from 'mapbox-gl'
import { useMapContext } from '../contexts/MapContext'
import { saveCameraMemory, restoreCameraMemory } from '../lib/mapCameraMemory'
import {
  JOURNEY_LAYERS,
  LAYER_JOURNEY_STAGES,
  LAYER_JOURNEY_STAGE_HOVER,
  LAYER_JOURNEY_SELECTED,
  STAGE_COLORS,
  showLayers,
  hideLayers,
  updateJourneyStagesSource,
  updateJourneySelectedSource,
} from '../components/Map/mapLayers'
import { RouteAnimation } from '../components/Map/RouteAnimation'
import { JourneyDetails, JourneyDetailsMobile } from '../components/Journeys/JourneyDetails'
import { JourneyList } from '../components/Journeys/JourneyList'
import { useJourneys } from '../hooks/useJourneys'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import type { JourneyStage } from '../hooks/useJourneys'

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

export function JourneysSection() {
  const { i18n, t } = useTranslation()
  const { mapRef, mapReady } = useMapContext()
  const {
    journeys,
    loadingJourneys,
    error,
    selectedJourney,
    selectJourney,
    stages,
    loadingStages,
    stagesError,
    selectedStage,
    selectStage,
  } = useJourneys(i18n.language)

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  const [animating, setAnimating] = useState(false)
  const didPreSelect = useRef(false)

  const handleAnimationComplete = useCallback(() => setAnimating(false), [])

  // Reset animation on stage change
  useEffect(() => {
    setAnimating(false)
  }, [selectedStage?.id])

  // Section mount: show journey layers, restore camera
  // Section unmount: save camera, hide layers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const defaultBounds = stages.length > 0 ? boundsFromStages(stages) : undefined
    restoreCameraMemory('journeys', map, defaultBounds ?? undefined)
    showLayers(map, JOURNEY_LAYERS)

    return () => {
      const m = mapRef.current
      if (!m) return
      saveCameraMemory('journeys', m)
      hideLayers(m, JOURNEY_LAYERS)
    }
  }, [mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync stages source + fit to all stages on data change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || stages.length === 0) return
    updateJourneyStagesSource(map, stages)

    // Only fit when no stage is selected — camera memory handles return visits
    if (!selectedStage) {
      const bounds = boundsFromStages(stages)
      if (!bounds) return
      const bottomPad = isMobile ? (sheetHeight / 100 * window.innerHeight) + 20 : 60
      map.fitBounds(bounds, {
        padding: isMobile
          ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
          : { top: 60, bottom: 60, left: 40, right: 60 },
        duration: 1200,
        maxZoom: 12,
      })
    }
  }, [stages, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selected stage source + fit + animate
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
    const stageColor = STAGE_COLORS[(selectedStage.stage_order - 1) % STAGE_COLORS.length]
    map.setPaintProperty(LAYER_JOURNEY_SELECTED, 'line-color', stageColor)

    const coords = selectedStage.route.geometry_geojson.coordinates as [number, number][]
    const bounds = boundsFromCoords(coords)
    if (!bounds) return

    const bottomPad = isMobile ? (sheetHeight / 100 * window.innerHeight) + 20 : 60
    map.fitBounds(bounds, {
      padding: isMobile
        ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
        : { top: 60, bottom: 60, left: 40, right: 60 },
      duration: 1500,
      maxZoom: 13,
    })
    map.once('moveend', () => setAnimating(true))
  }, [selectedStage, mapReady, isMobile, sheetHeight])

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
      if (stage) selectStage(stage)
    }

    function onMouseMove(e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) {
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
  }, [mapReady, stages, selectStage])

  // Pre-select journey from URL slug — runs once when journeys load
  useEffect(() => {
    if (!didPreSelect.current && slug && journeys.length > 0) {
      const match = journeys.find((j) => j.slug === slug)
      if (match) {
        didPreSelect.current = true
        selectJourney(match)
      } else {
        didPreSelect.current = true
        toast.info('Journey not found')
        navigate('/journeys', { replace: true })
      }
    }
  }, [slug, journeys, selectJourney, navigate])

  // Sync URL when a journey is selected
  useEffect(() => {
    if (!selectedJourney) return
    const expected = `/journeys/${selectedJourney.slug}`
    if (location.pathname !== expected) navigate(expected, { replace: true })
  }, [selectedJourney, navigate, location.pathname])

  // Auto-close list sheet when a journey is selected on mobile
  useEffect(() => {
    if (selectedJourney) setShowList(false)
  }, [selectedJourney])

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

  function handleClose() {
    selectJourney(null)
    selectStage(null)
    navigate('/journeys', { replace: true })
    if (isMobile) setShowList(true)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 z-10 relative flex-shrink-0 border-r border-gray-800 flex-col">
        {selectedJourney ? (
          <div className="flex-1 overflow-y-auto">
            <JourneyDetails
              journey={selectedJourney}
              stages={stages}
              selectedStage={selectedStage}
              loadingStages={loadingStages}
              stagesError={stagesError}
              onClose={handleClose}
              onStageSelect={selectStage}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-3 p-4 text-sm text-red-400">
                <span>{t('journey.unableToLoad')}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-shrink-0 text-xs text-orange-400 hover:text-orange-300 underline"
                >
                  {t('common.retry')}
                </button>
              </div>
            )}
            <JourneyList
              journeys={journeys}
              loading={loadingJourneys}
              selectedJourney={selectedJourney}
              onSelect={selectJourney}
            />
          </>
        )}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        {selectedJourney && (
          <JourneyDetailsMobile
            journey={selectedJourney}
            stages={stages}
            selectedStage={selectedStage}
            loadingStages={loadingStages}
            stagesError={stagesError}
            onClose={handleClose}
            onStageSelect={selectStage}
            onHeightChange={isMobile ? setSheetHeight : undefined}
          />
        )}
        {animating && selectedStage && mapRef.current && (
          <RouteAnimation
            map={mapRef.current}
            layerId={LAYER_JOURNEY_SELECTED}
            onComplete={handleAnimationComplete}
          />
        )}
      </div>

      {/* Mobile: floating pill — above tab bar */}
      {isMobile && !showList && !selectedJourney && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('journey.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          {t('journey.heading')} ({loadingJourneys ? '…' : journeys.length})
        </button>
      )}

      {/* Mobile: bottom sheet for journey list */}
      {isMobile && showList && (
        <div
          ref={listSheetRef}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl flex flex-col overflow-hidden"
          style={{ height: '65vh' }}
        >
          {/* Handle — drag only here */}
          <div
            style={{ touchAction: 'none' }}
            {...listDragHandlers}
            onClick={toggleListSnap}
            className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-300">
              {t('journey.heading')}
              {!loadingJourneys && <span className="ml-1.5 font-normal text-gray-500">({journeys.length})</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowList(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label={t('common.close')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-16">
            {error && (
              <div className="flex items-center gap-3 p-4 text-sm text-red-400">
                <span>{t('journey.unableToLoad')}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-shrink-0 text-xs text-orange-400 hover:text-orange-300 underline"
                >
                  {t('common.retry')}
                </button>
              </div>
            )}
            <JourneyList
              journeys={journeys}
              loading={loadingJourneys}
              selectedJourney={selectedJourney}
              onSelect={(j) => {
                selectJourney(j)
                setShowList(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
