import type { Destination, DestinationRoute } from '../../hooks/useDestinations'
import { LANDSCAPE_LABELS } from '../../lib/labels'

interface DestinationDetailsProps {
  destination: Destination
  featuredRoutes: DestinationRoute[]
  loadingRoutes: boolean
  onClose: () => void
}

function SkeletonRoute() {
  return (
    <div className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-900">
      <div className="flex-1">
        <div className="h-3 w-2/3 rounded bg-gray-700 mb-1.5" />
        <div className="h-2.5 w-1/3 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export function DestinationDetails({
  destination,
  featuredRoutes,
  loadingRoutes,
  onClose,
}: DestinationDetailsProps) {
  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            Destination
          </p>
          <h2 className="text-xl font-bold text-white leading-tight">{destination.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
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

      {/* Description */}
      {destination.description && (
        <p className="text-sm text-gray-400 leading-relaxed">{destination.description}</p>
      )}

      {/* Featured routes */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Featured Routes
        </h3>

        <div className="space-y-1.5">
          {loadingRoutes
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRoute key={i} />)
            : featuredRoutes.length === 0
              ? <p className="text-xs text-gray-400 italic">No featured routes.</p>
              : featuredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-900"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{route.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {route.distance_km != null && (
                          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                            {route.distance_km.toFixed(0)} km
                          </span>
                        )}
                        {route.landscape_type && (
                          <span className="text-xs bg-gray-800 text-amber-400 px-2 py-0.5 rounded-full">
                            {LANDSCAPE_LABELS[route.landscape_type] ?? route.landscape_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
        </div>
      </section>
    </div>
  )
}

export function DestinationDetailsMobile(props: DestinationDetailsProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[55vh] bg-gray-950 border-t border-gray-800 rounded-t-2xl overflow-y-auto z-20 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto mt-2 mb-4 h-1 w-12 rounded-full bg-gray-700" />
      <DestinationDetails {...props} />
    </div>
  )
}
