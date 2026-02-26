import type { Destination } from '../../hooks/useDestinations'

interface DestinationListProps {
  destinations: Destination[]
  loading: boolean
  selectedDestination: Destination | null
  onSelect: (d: Destination) => void
}

function SkeletonCard() {
  return (
    <div className="animate-pulse p-4 border-l-4 border-gray-800 rounded-lg bg-gray-900">
      <div className="h-4 w-1/2 rounded bg-gray-700 mb-2" />
      <div className="h-3 w-full rounded bg-gray-800 mb-1" />
      <div className="h-3 w-3/4 rounded bg-gray-800" />
    </div>
  )
}

export function DestinationList({
  destinations,
  loading,
  selectedDestination,
  onSelect,
}: DestinationListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Regions
          {!loading && <span className="ml-2 font-normal text-gray-600">({destinations.length})</span>}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : destinations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No regions found</div>
        ) : destinations.map((dest) => {
              const isSelected = selectedDestination?.id === dest.id
              return (
                <button
                  key={dest.id}
                  onClick={() => onSelect(dest)}
                  className={[
                    'w-full text-left p-4 rounded-lg border-l-4 transition-colors',
                    isSelected
                      ? 'border-amber-500 bg-gray-800'
                      : 'border-gray-800 bg-gray-900 hover:bg-gray-800 hover:border-gray-600',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold text-white mb-1">{dest.name}</p>
                  {dest.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {dest.description}
                    </p>
                  )}
                </button>
              )
            })}
      </div>
    </div>
  )
}
