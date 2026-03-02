import mapboxgl from 'mapbox-gl' // full import — needed for Popup class and LngLatBounds (documented exception to SharedMap-only rule)
import type { GeoJSONSource, LngLatBounds } from 'mapbox-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { toast } from 'sonner'
import { useMapContext } from '../contexts/MapContext'
import { saveCameraMemory, restoreCameraMemory } from '../lib/mapCameraMemory'
import {
  LAYER_BASE,
  LAYER_HOVER,
  LAYER_POI_CIRCLES,
  LAYER_SELECTED,
  SOURCE_ALL,
  SOURCE_SELECTED,
  ROUTES_LAYERS,
  showLayers,
  hideLayers,
  buildFeatureCollection,
  updatePOISource,
  updateSubRouteSource,
  updateContextSegmentsSource,
  updateGeoBoundarySource,
} from '../components/Map/mapLayers'
import { RouteAnimation } from '../components/Map/RouteAnimation'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { AlternativeSelector } from '../components/Routes/AlternativeSelector'
import { RoadList } from '../components/Routes/RoadList'
import { LandscapeFilter } from '../components/Routes/LandscapeFilter'
import { GeographicFilter } from '../components/Routes/GeographicFilter'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoads } from '../hooks/useRoads'
import { useRoutes, type Route } from '../hooks/useRoutes'
import type { RoadAlternative } from '../types/database'
import { useGeographicAreas } from '../hooks/useGeographicAreas'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import { supabase } from '../lib/supabase'
import type { OutletContextType } from '../components/AppShell/AppLayout'

export function RoutesSection() {
  const { i18n, t } = useTranslation()
  const { mapRef, mapReady } = useMapContext()
  const { onLoginOpen, user, isAuthenticated } = useOutletContext<OutletContextType>()

  const { routes, loading: routesLoading, error, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes(i18n.language)
  const { roads, loading: roadsLoading, selectedRoad, selectedAlternative, selectRoad, selectAlternative } = useRoads()
  const geoAreas = useGeographicAreas(null, null)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { recordView } = useHistory()

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const didPreSelect = useRef(false)

  const [landscapeFilters, setLandscapeFilters] = useState<string[]>([])
  const [activeSubRoute, setActiveSubRoute] = useState<Route | null>(null)
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  const [animating, setAnimating] = useState(false)

  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveRoute = activeSubRoute ?? selectedRoute
  const { pois } = useRoutePOIs(effectiveRoute?.id ?? null)
  const loading = routesLoading || roadsLoading

  // Stable callback — avoids restarting the RAF animation on every parent re-render
  const handleAnimationComplete = useCallback(() => setAnimating(false), [])

  // Fetch geo boundary GeoJSON when an area is selected
  const [geoBoundary, setGeoBoundary] = useState<GeoJSON.MultiPolygon | null>(null)
  useEffect(() => {
    const area = geoAreas.selectedArea
    if (!area) { setGeoBoundary(null); return }
    supabase.rpc('get_area_boundary', { p_area_id: area.id } as never).then(({ data }) => {
      const rows = (data ?? []) as { geojson: string }[]
      if (rows.length > 0) {
        try { setGeoBoundary(JSON.parse(rows[0].geojson) as GeoJSON.MultiPolygon) }
        catch { setGeoBoundary(null) }
      } else {
        setGeoBoundary(null)
      }
    })
  }, [geoAreas.selectedArea?.id])

  // Fetch road IDs in selected area for filtering the road list
  const [areaRoadIds, setAreaRoadIds] = useState<Set<string> | null>(null)
  useEffect(() => {
    const area = geoAreas.selectedArea
    if (!area) { setAreaRoadIds(null); return }
    supabase.rpc('get_routes_in_area', { p_area_id: area.id } as never).then(({ data }) => {
      const rows = (data ?? []) as { route_id: string; road_id: string | null }[]
      const ids = new Set(rows.map(r => r.road_id).filter(Boolean) as string[])
      setAreaRoadIds(ids)
    })
  }, [geoAreas.selectedArea?.id])

  // Build a slug→landscape_type lookup so we can filter roads by landscape
  const routeLandscapeBySlug = useMemo(
    () => new Map<string, string>(
      routes
        .filter((r): r is typeof r & { landscape_type: string } => r.landscape_type != null)
        .map(r => [r.slug, r.landscape_type])
    ),
    [routes]
  )

  const filteredRoads = useMemo(() => {
    let result = areaRoadIds ? roads.filter(r => areaRoadIds.has(r.id)) : roads
    if (landscapeFilters.length > 0) {
      result = result.filter(r =>
        r.alternatives.some(alt => {
          const lt = alt.route_slug != null ? routeLandscapeBySlug.get(alt.route_slug) : undefined
          return lt != null && landscapeFilters.includes(lt)
        })
      )
    }
    return result
  }, [roads, areaRoadIds, landscapeFilters, routeLandscapeBySlug])

  // Landscape filter options from all routes
  const availableTypes = useMemo(
    () => [...new Set(routes.map(r => r.landscape_type).filter(Boolean))].sort() as string[],
    [routes]
  )

  // Routes in the selected alternative's segments (to show as context on map)
  const contextSegments = useMemo<Route[]>(() => {
    if (!selectedRoad || !selectedAlternative) return []
    return routes.filter(r =>
      r.id !== effectiveRoute?.id &&
      selectedRoad.alternatives.some(alt =>
        alt.id !== selectedAlternative.id &&
        alt.geometry_geojson !== null
      )
    ).slice(0, 5) // safety limit
  }, [selectedRoad, selectedAlternative, routes, effectiveRoute?.id])

  // Legacy sub-routes (for route hierarchy within the old system)
  const getChildren = useMemo(() => {
    return (id: string) =>
      routes.filter(r => r.is_segment_of === id || r.is_extension_of === id || r.is_variant_of === id)
  }, [routes])

  const mapSubRoutes = !activeSubRoute && selectedRoute && !selectedRoad
    ? getChildren(selectedRoute.id)
    : []

  const isMobile = useIsMobile()

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

  // --- Section mount/unmount: layer visibility + camera memory ---
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Compute default bounds from routes for first-visit camera positioning.
    let defaultBounds: LngLatBounds | undefined
    if (routes.length > 0) {
      const allCoords = routes.flatMap((r) => r.geometry_geojson.coordinates as [number, number][])
      if (allCoords.length > 0) {
        const lons = allCoords.map((c) => c[0])
        const lats = allCoords.map((c) => c[1])
        defaultBounds = new mapboxgl.LngLatBounds(
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)]
        )
      }
    }

    restoreCameraMemory('routes', map, defaultBounds)
    showLayers(map, ROUTES_LAYERS)

    return () => {
      const m = mapRef.current
      if (!m) return
      saveCameraMemory('routes', m)
      hideLayers(m, ROUTES_LAYERS)
      // Remove popup on section unmount to prevent it showing over other sections
      popupRef.current?.remove()
      popupRef.current = null
    }
  }, [mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Data sync effects ---

  // Effect 1: Sync routes source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource(SOURCE_ALL) as GeoJSONSource | undefined
    source?.setData(buildFeatureCollection(routes))
  }, [routes, mapReady])

  // Effect 2: Sync hover filter
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (map.getLayer(LAYER_HOVER)) {
      map.setFilter(LAYER_HOVER, hoveredRouteId
        ? ['==', ['get', 'id'], hoveredRouteId]
        : ['==', ['get', 'id'], ''])
    }
  }, [hoveredRouteId, mapReady])

  // Effect 3: Handle route/alternative selection — update SOURCE_SELECTED, fitBounds, trigger animation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const source = map.getSource(SOURCE_SELECTED) as GeoJSONSource | undefined
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

    const bottomPanelHeight = isMobile ? window.innerHeight * (sheetHeight / 100) : undefined
    const bottomPad = isMobile ? (bottomPanelHeight ?? window.innerHeight * 0.55) + 20 : 60
    const padding = isMobile
      ? { top: 40, bottom: bottomPad, left: 40, right: 40 }
      : { top: 60, bottom: 60, left: 320, right: 60 }

    map.fitBounds(bounds, { padding, duration: 1000, maxZoom: 13 })
    map.once('moveend', () => setAnimating(true))
  }, [selectedRoute, selectedAlternative, mapReady, isMobile, sheetHeight])

  // Effect 4: Sync sub-routes source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateSubRouteSource(map, mapSubRoutes)
  }, [mapSubRoutes, mapReady])

  // Effect 5: Sync context segments source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateContextSegmentsSource(map, contextSegments)
  }, [contextSegments, mapReady])

  // Effect 6: Sync geo boundary source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateGeoBoundarySource(map, geoBoundary)
  }, [geoBoundary, mapReady])

  // Effect 7: Sync POI source + close popup when POIs change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updatePOISource(map, pois)
    // Close popup when POIs change (different route selected)
    popupRef.current?.remove()
    popupRef.current = null
  }, [pois, mapReady])

  // Effect 8: Pre-select from URL slug — runs once when routes load
  useEffect(() => {
    if (!didPreSelect.current && slug && routes.length > 0) {
      const match = routes.find(r => r.slug === slug)
      if (match) {
        didPreSelect.current = true
        selectRoute(match)
      } else {
        didPreSelect.current = true
        toast.info('Route not found')
        navigate('/routes', { replace: true })
      }
    }
  }, [slug, routes, selectRoute, navigate])

  // Effect 9: Sync URL when a route is selected
  useEffect(() => {
    if (!selectedRoute) return
    const expected = `/routes/${selectedRoute.slug}`
    if (location.pathname !== expected) {
      navigate(expected, { replace: true })
    }
  }, [selectedRoute, navigate, location.pathname])

  // Effect 10: Auto-close list on route select
  useEffect(() => {
    if (effectiveRoute) setShowList(false)
  }, [effectiveRoute])

  // Effect 11: Reset animation when route changes
  useEffect(() => { setAnimating(false) }, [selectedRoute?.id])

  // Effect 12: Clear sub-route when parent route changes
  useEffect(() => { setActiveSubRoute(null) }, [selectedRoute?.id])

  // Effect 13: Debounced history recording
  useEffect(() => {
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current)
    if (!effectiveRoute) return
    historyDebounceRef.current = setTimeout(() => { recordView(effectiveRoute.id) }, 2000)
    return () => { if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRoute?.id])

  // --- Event listener effects ---

  // Event effect 1: Route click and hover on LAYER_BASE
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    function onRouteClick(e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) {
      const feature = e.features?.[0]
      if (!feature) return
      const id = feature.properties?.id as string | undefined
      if (!id) return
      const route = routes.find((r) => r.id === id)
      if (route) selectRoute(route)
    }

    function onRouteHover(e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) {
      mapRef.current!.getCanvas().style.cursor = 'pointer'
      const id = e.features?.[0]?.properties?.id as string | undefined
      hoverRoute(id ?? null)
    }

    function onRouteLeave() {
      mapRef.current!.getCanvas().style.cursor = ''
      hoverRoute(null)
    }

    map.on('click', LAYER_BASE, onRouteClick)
    map.on('mousemove', LAYER_BASE, onRouteHover)
    map.on('mouseleave', LAYER_BASE, onRouteLeave)

    return () => {
      map.off('click', LAYER_BASE, onRouteClick)
      map.off('mousemove', LAYER_BASE, onRouteHover)
      map.off('mouseleave', LAYER_BASE, onRouteLeave)
    }
  }, [mapReady, routes, selectRoute, hoverRoute])

  // Event effect 2: POI click on LAYER_POI_CIRCLES — popup creation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

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
  }, [mapReady, pois])

  function handleClose() {
    selectRoute(null)
    selectRoad(null)
    setActiveSubRoute(null)
    navigate('/routes', { replace: true })
    if (isMobile) setShowList(true)
  }

  function handleSelectAlternative(alt: RoadAlternative) {
    selectAlternative(alt)
    const match = alt.route_slug ? routes.find(r => r.slug === alt.route_slug) : null
    if (match) selectRoute(match)
  }

  const sidebarContent = effectiveRoute ? (
    <div className="flex-1 overflow-y-auto">
      <DetailsContent
        route={effectiveRoute}
        onClose={handleClose}
        pois={pois}
        isFavorite={isFavorite(effectiveRoute.id)}
        isAuthenticated={isAuthenticated}
        onToggleFavorite={() => toggleFavorite(effectiveRoute.id)}
        onLoginRequired={onLoginOpen}
        children={activeSubRoute ? [] : getChildren(effectiveRoute.id)}
        parentRoute={activeSubRoute ? selectedRoute ?? undefined : undefined}
        onSelectSubRoute={setActiveSubRoute}
        onBackToParent={() => setActiveSubRoute(null)}
      />
    </div>
  ) : (
    <>
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-400">
          <span>{t('route.unableToLoad')}</span>
          <button
            onClick={() => window.location.reload()}
            className="flex-shrink-0 text-xs text-orange-400 hover:text-orange-300 underline"
          >
            {t('common.retry')}
          </button>
        </div>
      )}
      <LandscapeFilter
        availableTypes={availableTypes}
        selected={landscapeFilters}
        onChange={setLandscapeFilters}
      />
      <GeographicFilter
        selectedArea={geoAreas.selectedArea}
        breadcrumb={geoAreas.breadcrumb}
        onSelectArea={geoAreas.selectArea}
      />
      {selectedRoad ? (
        <AlternativeSelector
          alternatives={selectedRoad.alternatives}
          selected={selectedAlternative}
          onSelect={handleSelectAlternative}
        />
      ) : null}
      <RoadList
        roads={filteredRoads}
        loading={loading}
        selectedRoad={selectedRoad}
        selectedAlternative={selectedAlternative}
        onSelectRoad={selectRoad}
        hasActiveFilter={!!geoAreas.selectedArea || landscapeFilters.length > 0}
        onClearFilter={() => { geoAreas.selectArea(null); setLandscapeFilters([]) }}
      />
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 z-10 relative flex-shrink-0 border-r border-gray-800 flex-col">
        {sidebarContent}
      </div>

      {/* Map area: transparent so SharedMap shows through. Overlays render here. */}
      <div className="relative flex-1">
        {effectiveRoute && (
          <RouteDetails
            route={effectiveRoute}
            onClose={handleClose}
            pois={pois}
            isFavorite={isFavorite(effectiveRoute.id)}
            isAuthenticated={isAuthenticated}
            onToggleFavorite={() => toggleFavorite(effectiveRoute.id)}
            onLoginRequired={onLoginOpen}
            onHeightChange={isMobile ? setSheetHeight : undefined}
            children={activeSubRoute ? [] : getChildren(effectiveRoute.id)}
            parentRoute={activeSubRoute ? selectedRoute ?? undefined : undefined}
            onSelectSubRoute={setActiveSubRoute}
            onBackToParent={() => setActiveSubRoute(null)}
          />
        )}
        {animating && selectedRoute && mapRef.current && (
          <RouteAnimation
            map={mapRef.current}
            layerId={LAYER_SELECTED}
            onComplete={handleAnimationComplete}
          />
        )}
      </div>

      {/* Mobile: floating pill */}
      {isMobile && !showList && !effectiveRoute && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('road.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
        >
          {t('road.heading')} ({loading ? '…' : filteredRoads.length})
          {landscapeFilters.length > 0 && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
              {landscapeFilters.length}
            </span>
          )}
        </button>
      )}

      {/* Mobile: bottom sheet for road list */}
      {isMobile && showList && (
        <div
          ref={listSheetRef}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl flex flex-col overflow-hidden"
          style={{ height: '65vh' }}
        >
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
              {t('road.heading')}
              {!loading && <span className="ml-1.5 font-normal text-gray-500">({filteredRoads.length})</span>}
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

          {/* Mobile Filters */}
          <div className="flex-shrink-0 border-b border-gray-800 pb-2">
            <LandscapeFilter
              availableTypes={availableTypes}
              selected={landscapeFilters}
              onChange={setLandscapeFilters}
            />
            <GeographicFilter
              selectedArea={geoAreas.selectedArea}
              breadcrumb={geoAreas.breadcrumb}
              onSelectArea={geoAreas.selectArea}
            />
          </div>

          {selectedRoad && (
            <AlternativeSelector
              alternatives={selectedRoad.alternatives}
              selected={selectedAlternative}
              onSelect={handleSelectAlternative}
            />
          )}

          <div className="flex-1 overflow-y-auto pb-16">
            <RoadList
              roads={filteredRoads}
              loading={loading}
              selectedRoad={selectedRoad}
              selectedAlternative={selectedAlternative}
              onSelectRoad={selectRoad}
              showHeader={false}
              hasActiveFilter={!!geoAreas.selectedArea || landscapeFilters.length > 0}
              onClearFilter={() => { geoAreas.selectArea(null); setLandscapeFilters([]) }}
            />
          </div>
        </div>
      )}
    </>
  )
}
