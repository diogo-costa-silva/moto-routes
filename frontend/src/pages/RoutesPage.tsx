import { RouteMap } from '../components/Map/RouteMap'
import { RouteDetails } from '../components/Routes/RouteDetails'
import { RouteList } from '../components/Routes/RouteList'
import { useRoutes } from '../hooks/useRoutes'

export function RoutesPage() {
  const { routes, loading, selectedRoute, hoveredRouteId, selectRoute, hoverRoute } = useRoutes()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar: hidden on mobile when route is selected */}
      <div
        className={[
          'w-full md:w-80 flex-shrink-0 border-r border-gray-800 flex flex-col',
          selectedRoute ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
          <a href="/" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Back
          </a>
          <span className="text-gray-700">|</span>
          <span className="text-sm font-semibold text-gray-300">Moto Routes</span>
        </div>

        <RouteList
          routes={routes}
          loading={loading}
          selectedRoute={selectedRoute}
          hoveredRouteId={hoveredRouteId}
          onSelect={selectRoute}
          onHover={hoverRoute}
        />
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <RouteMap
          routes={routes}
          selectedRoute={selectedRoute}
          hoveredRouteId={hoveredRouteId}
          onRouteClick={selectRoute}
          onRouteHover={hoverRoute}
        />

        {selectedRoute && (
          <RouteDetails route={selectedRoute} onClose={() => selectRoute(null)} />
        )}
      </div>
    </div>
  )
}
