import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { LanguageSwitcher } from '../components/AppShell/LanguageSwitcher'
import { RouteMap } from '../components/Map/RouteMap'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { AlternativeSelector } from '../components/Routes/AlternativeSelector'
import { RoadList } from '../components/Routes/RoadList'
import { LandscapeFilter } from '../components/Routes/LandscapeFilter'
import { GeographicFilter } from '../components/Routes/GeographicFilter'
import { LoginModal } from '../components/Auth/LoginModal'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoads } from '../hooks/useRoads'
import { useRoutes, type Route } from '../hooks/useRoutes'
import type { RoadAlternative } from '../types/database'
import { useGeographicAreas } from '../hooks/useGeographicAreas'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'
import { supabase } from '../lib/supabase'

export function RoutesPage() {
  const { i18n, t } = useTranslation()
  const { routes, loading: routesLoading, error, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes(i18n.language)
  const { roads, loading: roadsLoading, selectedRoad, selectedAlternative, selectRoad, selectAlternative } = useRoads()
  const geoAreas = useGeographicAreas(null, null)
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { recordView } = useHistory()

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const didPreSelect = useRef(false)

  const [landscapeFilters, setLandscapeFilters] = useState<string[]>([])
  const [activeSubRoute, setActiveSubRoute] = useState<Route | null>(null)

  const effectiveRoute = activeSubRoute ?? selectedRoute
  const { pois } = useRoutePOIs(effectiveRoute?.id ?? null)
  const loading = routesLoading || roadsLoading

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

  const filteredRoads = useMemo(
    () => areaRoadIds ? roads.filter(r => areaRoadIds.has(r.id)) : roads,
    [roads, areaRoadIds]
  )

  // Landscape filter options from all routes
  const availableTypes = useMemo(
    () => [...new Set(routes.map(r => r.landscape_type).filter(Boolean))].sort() as string[],
    [routes]
  )

  // Routes in the selected alternative's segments (to show as context on map)
  const contextSegments = useMemo<Route[]>(() => {
    if (!selectedRoad || !selectedAlternative) return []
    // All routes belonging to this road, excluding the active alternative's primary route
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
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const historyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear sub-route when parent changes
  useEffect(() => { setActiveSubRoute(null) }, [selectedRoute?.id])

  // Pre-select from URL slug — runs once when routes load
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
  }, [slug, routes, selectRoute])

  // Sync URL when a route is selected
  useEffect(() => {
    if (!selectedRoute) return
    const expected = `/routes/${selectedRoute.slug}`
    if (location.pathname !== expected) {
      navigate(expected, { replace: true })
    }
  }, [selectedRoute, navigate, location.pathname])

  // Auto-close list sheet when route selected on mobile
  useEffect(() => { if (effectiveRoute) setShowList(false) }, [effectiveRoute])

  // Debounced history recording
  useEffect(() => {
    if (historyDebounce.current) clearTimeout(historyDebounce.current)
    if (!effectiveRoute) return
    historyDebounce.current = setTimeout(() => { recordView(effectiveRoute.id) }, 2000)
    return () => { if (historyDebounce.current) clearTimeout(historyDebounce.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRoute?.id])

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

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
        isAuthenticated={!!user}
        onToggleFavorite={() => toggleFavorite(effectiveRoute.id)}
        onLoginRequired={() => setLoginModalOpen(true)}
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
      <NavHeader />
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
          {sidebarContent}
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <RouteMap
            routes={routes.filter(r =>
              landscapeFilters.length === 0 || (r.landscape_type != null && landscapeFilters.includes(r.landscape_type))
            )}
            selectedRoute={effectiveRoute}
            hoveredRouteId={hoveredRouteId}
            isMobile={isMobile}
            bottomPanelHeight={isMobile ? window.innerHeight * (sheetHeight / 100) : undefined}
            onRouteClick={selectRoute}
            onRouteHover={hoverRoute}
            pois={pois}
            onPOIClick={() => {}}
            subRoutes={mapSubRoutes}
            selectedAlternative={selectedAlternative}
            contextSegments={contextSegments}
            geoBoundary={geoBoundary}
          />

          {effectiveRoute && (
            <RouteDetails
              route={effectiveRoute}
              onClose={handleClose}
              pois={pois}
              isFavorite={isFavorite(effectiveRoute.id)}
              isAuthenticated={!!user}
              onToggleFavorite={() => toggleFavorite(effectiveRoute.id)}
              onLoginRequired={() => setLoginModalOpen(true)}
              onHeightChange={isMobile ? setSheetHeight : undefined}
              children={activeSubRoute ? [] : getChildren(effectiveRoute.id)}
              parentRoute={activeSubRoute ? selectedRoute ?? undefined : undefined}
              onSelectSubRoute={setActiveSubRoute}
              onBackToParent={() => setActiveSubRoute(null)}
            />
          )}
        </div>
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
              <LanguageSwitcher />
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

      <MobileTabBar />
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  )
}
