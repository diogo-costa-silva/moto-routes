import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useIsMobile } from '../hooks/useIsMobile'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { RouteMap } from '../components/Map/RouteMap'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { RouteList } from '../components/Routes/RouteList'
import { LandscapeFilter } from '../components/Routes/LandscapeFilter'
import { LoginModal } from '../components/Auth/LoginModal'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoutes } from '../hooks/useRoutes'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'

export function RoutesPage() {
  const { i18n, t } = useTranslation()
  const { routes, loading, error, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes(i18n.language)
  const { pois } = useRoutePOIs(selectedRoute?.id ?? null)
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { recordView } = useHistory()

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Guard: pre-select only once (prevents re-select loop when closing)
  const didPreSelect = useRef(false)

  const [landscapeFilters, setLandscapeFilters] = useState<string[]>([])

  const availableTypes = useMemo(
    () => [...new Set(routes.map(r => r.landscape_type).filter(Boolean))].sort() as string[],
    [routes]
  )
  const filteredRoutes = useMemo(
    () => landscapeFilters.length > 0
      ? routes.filter(r => r.landscape_type != null && landscapeFilters.includes(r.landscape_type))
      : routes,
    [routes, landscapeFilters]
  )

  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const historyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (selectedRoute) setShowList(false)
  }, [selectedRoute])

  // Debounced history recording — fires 2s after a route is selected
  useEffect(() => {
    if (historyDebounce.current) clearTimeout(historyDebounce.current)
    if (!selectedRoute) return
    historyDebounce.current = setTimeout(() => {
      recordView(selectedRoute.id)
    }, 2000)
    return () => {
      if (historyDebounce.current) clearTimeout(historyDebounce.current)
    }
  }, [selectedRoute?.id])

  const listSheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number>(0)
  const dragging = useRef<boolean>(false)

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragging.current = true
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0 && listSheetRef.current) {
      listSheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }

  function onSheetTouchEnd(e: React.TouchEvent) {
    dragging.current = false
    const delta = e.changedTouches[0].clientY - dragStartY.current
    if (listSheetRef.current) {
      listSheetRef.current.style.transform = ''
      listSheetRef.current.style.transition = 'transform 0.2s ease'
      setTimeout(() => {
        if (listSheetRef.current) listSheetRef.current.style.transition = ''
      }, 200)
    }
    if (delta > 80) {
      setShowList(false)
    }
  }

  function handleClose() {
    selectRoute(null)
    navigate('/routes', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
      <NavHeader />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar: visible on lg+, hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        {selectedRoute ? (
          <div className="flex-1 overflow-y-auto">
            <DetailsContent
              route={selectedRoute}
              onClose={handleClose}
              pois={pois}
              isFavorite={isFavorite(selectedRoute.id)}
              isAuthenticated={!!user}
              onToggleFavorite={() => toggleFavorite(selectedRoute.id)}
              onLoginRequired={() => setLoginModalOpen(true)}
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
              routes={filteredRoutes}
              loading={loading}
              selectedRoute={selectedRoute}
              hoveredRouteId={hoveredRouteId}
              onSelect={selectRoute}
              onHover={hoverRoute}
            />
          </>
        )}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <RouteMap
          routes={filteredRoutes}
          selectedRoute={selectedRoute}
          hoveredRouteId={hoveredRouteId}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * 0.55 : undefined}
          onRouteClick={selectRoute}
          onRouteHover={hoverRoute}
          pois={pois}
          onPOIClick={() => {}}
        />

        {selectedRoute && (
          <RouteDetails
            route={selectedRoute}
            onClose={handleClose}
            pois={pois}
            isFavorite={isFavorite(selectedRoute.id)}
            isAuthenticated={!!user}
            onToggleFavorite={() => toggleFavorite(selectedRoute.id)}
            onLoginRequired={() => setLoginModalOpen(true)}
          />
        )}
      </div>
      </div>

      {/* Mobile: floating pill — above tab bar (bottom-16 = 64px) */}
      {isMobile && !showList && !selectedRoute && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('route.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
        >
          {t('route.heading')} ({loading ? '…' : filteredRoutes.length})
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
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl h-[55vh] flex flex-col"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-300">
              {t('route.heading')}
              {!loading && <span className="ml-1.5 font-normal text-gray-500">({filteredRoutes.length})</span>}
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
              routes={filteredRoutes}
              loading={loading}
              selectedRoute={selectedRoute}
              hoveredRouteId={hoveredRouteId}
              onSelect={selectRoute}
              onHover={hoverRoute}
              showHeader={false}
            />
          </div>
        </div>
      )}

      <MobileTabBar />

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  )
}
