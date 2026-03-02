import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import mapboxgl from 'mapbox-gl'
import { useMapContext } from '../contexts/MapContext'
import { saveCameraMemory, restoreCameraMemory } from '../lib/mapCameraMemory'
import {
  DESTINATION_LAYERS,
  LAYER_DESTINATION_FILL,
  LAYER_DESTINATION_ROUTES,
  showLayers,
  hideLayers,
  updateDestinationBBoxSource,
  updateDestinationRoutesSource,
} from '../components/Map/mapLayers'
import { DestinationDetails, DestinationDetailsMobile } from '../components/Destinations/DestinationDetails'
import { DestinationList } from '../components/Destinations/DestinationList'
import { useDestinations } from '../hooks/useDestinations'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import type { Destination, DestinationRoute } from '../hooks/useDestinations'

function boundsFromRoutes(routes: DestinationRoute[]): mapboxgl.LngLatBounds | null {
  const coords = routes.flatMap((r) => {
    if (!r.geometry_geojson || r.geometry_geojson.type !== 'LineString') return []
    return r.geometry_geojson.coordinates as [number, number][]
  })
  if (coords.length === 0) return null
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return new mapboxgl.LngLatBounds([Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)])
}

function boundsFromPolygon(polygon: GeoJSON.Polygon): mapboxgl.LngLatBounds {
  const ring = polygon.coordinates[0] as [number, number][]
  const lons = ring.map((c) => c[0])
  const lats = ring.map((c) => c[1])
  return new mapboxgl.LngLatBounds([Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)])
}

export function DestinationsSection() {
  const { i18n, t } = useTranslation()
  const { mapRef, mapReady } = useMapContext()
  const {
    destinations, loadingDestinations, error,
    selectedDestination, selectDestination,
    featuredRoutes, loadingRoutes,
  } = useDestinations(i18n.language)

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  const lastPreSelectedSlug = useRef<string | null>(null)

  // Section mount: show destination layers, restore camera
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    restoreCameraMemory('destinations', map)
    showLayers(map, DESTINATION_LAYERS)

    return () => {
      const m = mapRef.current
      if (!m) return
      saveCameraMemory('destinations', m)
      hideLayers(m, DESTINATION_LAYERS)
    }
  }, [mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync destination bbox + fit bounds when selection changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (!selectedDestination) {
      updateDestinationRoutesSource(map, [])
      updateDestinationBBoxSource(map, null)
      // Fit to all destinations for overview
      if (destinations.length > 0) {
        const allCoords = destinations.flatMap((d) => d.bounding_box_geojson.coordinates[0] as [number, number][])
        if (allCoords.length > 0) {
          const lons = allCoords.map((c) => c[0])
          const lats = allCoords.map((c) => c[1])
          const allBounds = new mapboxgl.LngLatBounds([Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)])
          map.fitBounds(allBounds, { padding: { top: 60, bottom: 80, left: 60, right: 60 }, duration: 800, maxZoom: 10 })
        }
      }
      return
    }

    updateDestinationBBoxSource(map, selectedDestination.bounding_box_geojson)

    const polyBounds = boundsFromPolygon(selectedDestination.bounding_box_geojson)
    const routeBounds = boundsFromRoutes(featuredRoutes)
    const bounds = routeBounds ? polyBounds.extend(routeBounds) : polyBounds
    const bottomPad = isMobile ? (sheetHeight / 100 * window.innerHeight) + 20 : 60

    map.fitBounds(bounds, {
      padding: isMobile ? { top: 40, bottom: bottomPad, left: 40, right: 40 } : { top: 60, bottom: 60, left: 340, right: 60 },
      duration: 1200,
      maxZoom: 12,
    })
  }, [selectedDestination, destinations, mapReady, isMobile, sheetHeight]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync featured routes source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateDestinationRoutesSource(map, featuredRoutes)
  }, [featuredRoutes, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Deselect click listener — IN useEffect WITH CLEANUP (fixes DestinationMap.tsx bug)
  // Original bug: listener was inside map.on('load') with no cleanup, capturing stale onDeselect
  const selectDestinationRef = useRef(selectDestination)
  selectDestinationRef.current = selectDestination

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    function handleDeselect(e: mapboxgl.MapMouseEvent) {
      const features = map!.queryRenderedFeatures(e.point, {
        layers: [LAYER_DESTINATION_FILL, LAYER_DESTINATION_ROUTES],
      })
      if (features.length === 0) {
        selectDestinationRef.current(null)
        navigate('/destinations', { replace: true })
      }
    }

    map.on('click', handleDeselect)
    return () => { map.off('click', handleDeselect) }
  }, [mapReady, navigate])

  // Pre-select from URL slug
  useEffect(() => {
    if (lastPreSelectedSlug.current !== slug && slug && destinations.length > 0) {
      const match = destinations.find((d) => d.slug === slug)
      if (match) {
        lastPreSelectedSlug.current = slug
        selectDestination(match)
      } else {
        lastPreSelectedSlug.current = slug
        toast.info('Region not found')
        navigate('/destinations', { replace: true })
      }
    }
  }, [slug, destinations, selectDestination, navigate])

  // Sync URL on selection
  useEffect(() => {
    if (!selectedDestination) return
    const expected = `/destinations/${selectedDestination.slug}`
    if (location.pathname !== expected) navigate(expected, { replace: true })
  }, [selectedDestination, navigate, location.pathname])

  // Auto-close list on selection
  useEffect(() => {
    if (selectedDestination) setShowList(false)
  }, [selectedDestination])

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

  function handleClose() {
    selectDestination(null)
    navigate('/destinations', { replace: true })
    if (isMobile) setShowList(true)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 z-10 relative flex-shrink-0 border-r border-gray-800 flex-col">
        {error && <div className="p-4 text-sm text-red-400">{t('destination.unableToLoad')}</div>}
        {!error && selectedDestination ? (
          <div className="flex-1 overflow-y-auto">
            <DestinationDetails
              destination={selectedDestination}
              featuredRoutes={featuredRoutes}
              loadingRoutes={loadingRoutes}
              onClose={handleClose}
            />
          </div>
        ) : !error ? (
          <DestinationList
            destinations={destinations}
            loading={loadingDestinations}
            selectedDestination={selectedDestination}
            onSelect={selectDestination}
          />
        ) : null}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        {selectedDestination && (
          <DestinationDetailsMobile
            destination={selectedDestination}
            featuredRoutes={featuredRoutes}
            loadingRoutes={loadingRoutes}
            onClose={handleClose}
            onHeightChange={isMobile ? setSheetHeight : undefined}
          />
        )}
      </div>

      {/* Mobile: floating pill */}
      {isMobile && !showList && !selectedDestination && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('destination.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          {t('destination.heading')} ({loadingDestinations ? '…' : destinations.length})
        </button>
      )}

      {/* Mobile: bottom sheet */}
      {isMobile && showList && (
        <div ref={listSheetRef} className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl flex flex-col overflow-hidden" style={{ height: '65vh' }}>
          <div style={{ touchAction: 'none' }} {...listDragHandlers} onClick={toggleListSnap} className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-300">
              {t('destination.heading')}
              {!loadingDestinations && <span className="ml-1.5 font-normal text-gray-500">({destinations.length})</span>}
            </span>
            <button onClick={() => setShowList(false)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors" aria-label={t('common.close')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-16">
            {error && <div className="p-4 text-sm text-red-400">{t('destination.unableToLoad')}</div>}
            <DestinationList
              destinations={destinations}
              loading={loadingDestinations}
              selectedDestination={selectedDestination}
              onSelect={(d) => { selectDestination(d); setShowList(false) }}
            />
          </div>
        </div>
      )}
    </>
  )
}
