import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useIsMobile } from '../hooks/useIsMobile'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { RouteMap } from '../components/Map/RouteMap'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { RouteList } from '../components/Routes/RouteList'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoutes } from '../hooks/useRoutes'

export function RoutesPage() {
  const { routes, loading, error, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes()
  const { pois } = useRoutePOIs(selectedRoute?.id ?? null)

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Guard: pre-select only once (prevents re-select loop when closing)
  const didPreSelect = useRef(false)

  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)

  // Pre-select from URL slug — runs once when routes load
  useEffect(() => {
    if (!didPreSelect.current && slug && routes.length > 0) {
      const match = routes.find((r) => r.slug === slug)
      if (match) {
        didPreSelect.current = true
        selectRoute(match)
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
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar: visible on md+, hidden on mobile */}
      <div className="hidden md:flex md:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        <NavHeader />

        {selectedRoute ? (
          <div className="flex-1 overflow-y-auto">
            <DetailsContent route={selectedRoute} onClose={handleClose} pois={pois} />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 text-sm text-red-400">
                Unable to load routes. Please try again.
              </div>
            )}
            <RouteList
              routes={routes}
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
          routes={routes}
          selectedRoute={selectedRoute}
          hoveredRouteId={hoveredRouteId}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * 0.5 : undefined}
          onRouteClick={selectRoute}
          onRouteHover={hoverRoute}
          pois={pois}
          onPOIClick={() => {}}
        />

        {selectedRoute && (
          <RouteDetails route={selectedRoute} onClose={handleClose} pois={pois} />
        )}
      </div>

      {/* Mobile: floating pill — above tab bar (bottom-16 = 64px) */}
      {isMobile && !showList && !selectedRoute && (
        <button
          onClick={() => setShowList(true)}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          Routes ({loading ? '…' : routes.length})
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
            <span className="text-sm font-semibold text-gray-300">Routes</span>
            <button
              onClick={() => setShowList(false)}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <RouteList
              routes={routes}
              loading={loading}
              selectedRoute={selectedRoute}
              hoveredRouteId={hoveredRouteId}
              onSelect={selectRoute}
              onHover={hoverRoute}
            />
          </div>
        </div>
      )}

      <MobileTabBar />
    </div>
  )
}
