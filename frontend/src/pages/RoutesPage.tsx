import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { RouteMap } from '../components/Map/RouteMap'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { RouteList } from '../components/Routes/RouteList'
import { LandscapeFilter } from '../components/Routes/LandscapeFilter'
import { LoginModal } from '../components/Auth/LoginModal'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoutes, type Route } from '../hooks/useRoutes'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'

export function RoutesPage() {
  const { i18n, t } = useTranslation()
  const { routes, rootRoutes, getChildren, loading, error, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes(i18n.language)
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { recordView } = useHistory()

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Guard: pre-select only once (prevents re-select loop when closing)
  const didPreSelect = useRef(false)

  const [landscapeFilters, setLandscapeFilters] = useState<string[]>([])
  const [activeSubRoute, setActiveSubRoute] = useState<Route | null>(null)

  // The route shown in details/map: sub-route takes priority over parent
  const effectiveRoute = activeSubRoute ?? selectedRoute

  const { pois } = useRoutePOIs(effectiveRoute?.id ?? null)

  const availableTypes = useMemo(
    () => [...new Set(rootRoutes.map(r => r.landscape_type).filter(Boolean))].sort() as string[],
    [rootRoutes]
  )
  const filteredRoutes = useMemo(
    () => landscapeFilters.length > 0
      ? routes.filter(r => r.landscape_type != null && landscapeFilters.includes(r.landscape_type))
      : routes,
    [routes, landscapeFilters]
  )
  const rootFilteredRoutes = useMemo(
    () => landscapeFilters.length > 0
      ? rootRoutes.filter(r => r.landscape_type != null && landscapeFilters.includes(r.landscape_type))
      : rootRoutes,
    [rootRoutes, landscapeFilters]
  )
  const childrenCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of routes) {
      const parentId = r.is_segment_of ?? r.is_extension_of ?? r.is_variant_of
      if (parentId) counts[parentId] = (counts[parentId] ?? 0) + 1
    }
    return counts
  }, [routes])

  // Sub-routes to show on map when viewing a parent (not when a sub-route is active)
  const mapSubRoutes = !activeSubRoute && selectedRoute ? getChildren(selectedRoute.id) : []

  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const historyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear sub-route when parent route changes
  useEffect(() => {
    setActiveSubRoute(null)
  }, [selectedRoute?.id])

  // Clear selection when active filter excludes the selected route
  useEffect(() => {
    if (selectedRoute && !filteredRoutes.find(r => r.id === selectedRoute.id)) {
      selectRoute(null)
      navigate('/routes', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRoutes, selectedRoute?.id])

  // Pre-select from URL slug — runs once when routes load
  useEffect(() => {
    if (!didPreSelect.current && slug && routes.length > 0) {
      const match = routes.find((r) => r.slug === slug)
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

  // Sync URL when a route is selected (only push if URL doesn't match)
  useEffect(() => {
    if (!selectedRoute) return
    const expected = `/routes/${selectedRoute.slug}`
    if (location.pathname !== expected) {
      navigate(expected, { replace: true })
    }
  }, [selectedRoute, navigate, location.pathname])

  // Auto-close list sheet when a route is selected on mobile
  useEffect(() => {
    if (effectiveRoute) setShowList(false)
  }, [effectiveRoute])

  // Debounced history recording — fires 2s after a route is selected
  useEffect(() => {
    if (historyDebounce.current) clearTimeout(historyDebounce.current)
    if (!effectiveRoute) return
    historyDebounce.current = setTimeout(() => {
      recordView(effectiveRoute.id)
    }, 2000)
    return () => {
      if (historyDebounce.current) clearTimeout(historyDebounce.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRoute?.id])

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

  function handleClose() {
    selectRoute(null)
    setActiveSubRoute(null)
    navigate('/routes', { replace: true })
    if (isMobile) setShowList(true)
  }

  function handleSelectSubRoute(route: Route) {
    setActiveSubRoute(route)
  }

  function handleBackToParent() {
    setActiveSubRoute(null)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
      <NavHeader />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar: visible on lg+, hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        {effectiveRoute ? (
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
              onSelectSubRoute={handleSelectSubRoute}
              onBackToParent={handleBackToParent}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 text-sm text-red-400">
                {t('route.unableToLoad')}
              </div>
            )}
            <LandscapeFilter
              availableTypes={availableTypes}
              selected={landscapeFilters}
              onChange={setLandscapeFilters}
            />
            <RouteList
              routes={rootFilteredRoutes}
              loading={loading}
              selectedRoute={selectedRoute}
              hoveredRouteId={hoveredRouteId}
              onSelect={selectRoute}
              onHover={hoverRoute}
              childrenCount={childrenCount}
            />
          </>
        )}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <RouteMap
          routes={filteredRoutes}
          selectedRoute={effectiveRoute}
          hoveredRouteId={hoveredRouteId}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * (sheetHeight / 100) : undefined}
          onRouteClick={selectRoute}
          onRouteHover={hoverRoute}
          pois={pois}
          onPOIClick={() => {}}
          subRoutes={mapSubRoutes}
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
            onSelectSubRoute={handleSelectSubRoute}
            onBackToParent={handleBackToParent}
          />
        )}
      </div>
      </div>

      {/* Mobile: floating pill — above tab bar (bottom-16 = 64px) */}
      {isMobile && !showList && !effectiveRoute && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('route.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
        >
          {t('route.heading')} ({loading ? '…' : rootFilteredRoutes.length})
          {landscapeFilters.length > 0 && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
              {landscapeFilters.length}
            </span>
          )}
        </button>
      )}

      {/* Mobile: bottom sheet for route list */}
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
              {t('route.heading')}
              {!loading && <span className="ml-1.5 font-normal text-gray-500">({rootFilteredRoutes.length})</span>}
            </span>
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

          {availableTypes.length > 0 && (
            <LandscapeFilter
              availableTypes={availableTypes}
              selected={landscapeFilters}
              onChange={setLandscapeFilters}
            />
          )}

          <div className="flex-1 overflow-y-auto pb-16">
            <RouteList
              routes={rootFilteredRoutes}
              loading={loading}
              selectedRoute={selectedRoute}
              hoveredRouteId={hoveredRouteId}
              onSelect={selectRoute}
              onHover={hoverRoute}
              showHeader={false}
              childrenCount={childrenCount}
            />
          </div>
        </div>
      )}

      <MobileTabBar />

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  )
}
