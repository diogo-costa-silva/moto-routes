import { useTranslation } from 'react-i18next'
import type { Route } from '../../hooks/useRoutes'

interface RouteListProps {
  routes: Route[]
  loading: boolean
  selectedRoute: Route | null
  hoveredRouteId: string | null
  onSelect: (route: Route) => void
  onHover: (id: string | null) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-400',
  moderate: 'text-yellow-400',
  hard: 'text-red-400',
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 h-4 w-3/4 rounded bg-gray-700" />
      <div className="mb-3 h-3 w-1/3 rounded bg-gray-800" />
      <div className="flex gap-3">
        <div className="h-3 w-16 rounded bg-gray-800" />
        <div className="h-3 w-20 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export function RouteList({
  routes,
  loading,
  selectedRoute,
  hoveredRouteId,
  onSelect,
  onHover,
}: RouteListProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          {t('route.heading')}
          {!loading && (
            <span className="ml-2 font-normal text-gray-600">({routes.length})</span>
          )}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : routes.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{t('route.noRoutes')}</p>
        ) : (
          routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id
              const isHovered = hoveredRouteId === route.id

              return (
                <button
                  key={route.id}
                  className={[
                    'w-full rounded-lg border text-left transition-all duration-150 p-4',
                    isSelected
                      ? 'border-orange-500 bg-gray-800 border-l-4'
                      : isHovered
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800',
                  ].join(' ')}
                  onClick={() => onSelect(route)}
                  onMouseEnter={() => onHover(route.id)}
                  onMouseLeave={() => onHover(null)}
                >
                  <p className="mb-1 font-semibold text-white leading-tight">{route.name}</p>

                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {route.landscape_type && (
                      <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                        {t(`landscape.${route.landscape_type}`, { defaultValue: route.landscape_type })}
                      </span>
                    )}
                    {route.difficulty && (
                      <span
                        className={`text-xs font-medium capitalize ${DIFFICULTY_COLORS[route.difficulty] ?? 'text-gray-400'}`}
                      >
                        {route.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500">
                    {route.distance_km != null && (
                      <span>{route.distance_km.toFixed(0)} km</span>
                    )}
                    {route.elevation_gain != null && (
                      <span>↑ {route.elevation_gain.toFixed(0)} m</span>
                    )}
                  </div>
                </button>
              )
            })
        )}
      </div>
    </div>
  )
}
