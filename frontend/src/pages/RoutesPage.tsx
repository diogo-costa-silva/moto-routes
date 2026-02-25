import { useEffect, useState } from 'react'
import { RouteMap } from '../components/Map/RouteMap'
import { DetailsContent, RouteDetails } from '../components/Routes/RouteDetails'
import { RouteList } from '../components/Routes/RouteList'
import { useRoutePOIs } from '../hooks/useRoutePOIs'
import { useRoutes } from '../hooks/useRoutes'

export function RoutesPage() {
  const { routes, loading, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes()
  const { pois } = useRoutePOIs(selectedRoute?.id ?? null)

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-close list sheet when a route is selected on mobile
  useEffect(() => {
    if (selectedRoute) setShowList(false)
  }, [selectedRoute])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar: visible on md+, hidden on mobile */}
      <div className="hidden md:flex md:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
          <a href="/" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Back
          </a>
          <span className="text-gray-700">|</span>
          <span className="text-sm font-semibold text-gray-300">Moto Routes</span>
        </div>

        {selectedRoute ? (
          <div className="flex-1 overflow-y-auto">
            <DetailsContent route={selectedRoute} onClose={() => selectRoute(null)} pois={pois} />
          </div>
        ) : (
          <RouteList
            routes={routes}
            loading={loading}
            selectedRoute={selectedRoute}
            hoveredRouteId={hoveredRouteId}
            onSelect={selectRoute}
            onHover={hoverRoute}
          />
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
          <RouteDetails route={selectedRoute} onClose={() => selectRoute(null)} pois={pois} />
        )}
      </div>

      {/* Mobile: floating pill button — visible when list is closed and no route selected */}
      {isMobile && !showList && !selectedRoute && (
        <button
          onClick={() => setShowList(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          Routes ({loading ? '…' : routes.length})
        </button>
      )}

      {/* Mobile: bottom sheet for route list */}
      {isMobile && showList && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl h-[55vh] flex flex-col">
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          {/* Sheet header with close button */}
          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-300">Routes</span>
            <button
              onClick={() => setShowList(false)}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable list */}
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
    </div>
  )
}
