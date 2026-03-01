import type { RoadAlternative, RoadWithAlternatives } from '../../types/database'

interface RoadListProps {
  roads: RoadWithAlternatives[]
  loading: boolean
  selectedRoad: RoadWithAlternatives | null
  selectedAlternative: RoadAlternative | null
  onSelectRoad: (road: RoadWithAlternatives) => void
  showHeader?: boolean
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 w-14 rounded bg-gray-700" />
        <div className="h-4 w-2/5 rounded bg-gray-800" />
      </div>
      <div className="flex gap-3 mt-2">
        <div className="h-3 w-16 rounded bg-gray-800" />
        <div className="h-3 w-20 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export function RoadList({ roads, loading, selectedRoad, selectedAlternative, onSelectRoad, showHeader = true }: RoadListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {showHeader && (
        <div className="border-b border-gray-800 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Estradas
            {!loading && <span className="ml-2 font-normal text-gray-600">({roads.length})</span>}
          </h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : roads.length === 0
            ? <p className="p-4 text-sm text-gray-500">Nenhuma estrada disponível.</p>
            : roads.map((road) => {
                const isSelected = selectedRoad?.id === road.id
                const displayAlt = isSelected ? selectedAlternative : road.defaultAlternative
                const distKm = displayAlt?.distance_km ?? road.total_distance_km
                const elevGain = displayAlt?.elevation_gain

                return (
                  <button
                    key={road.id}
                    className={[
                      'w-full rounded-lg border text-left transition-all duration-150 p-4',
                      isSelected
                        ? 'border-orange-500 bg-gray-800 border-l-4'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800',
                    ].join(' ')}
                    onClick={() => onSelectRoad(road)}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="flex-shrink-0 rounded bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-400 font-mono">
                        {road.code}
                      </span>
                      <p className="font-semibold text-white leading-tight text-sm">
                        {road.designation ?? road.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {distKm != null && <span>{Number(distKm).toFixed(0)} km</span>}
                      {elevGain != null && <span>↑ {elevGain.toFixed(0)} m</span>}
                      {road.alt_count > 1 && (
                        <span className="ml-auto rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-400 font-medium">
                          {road.alt_count} alternativas
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
        }
      </div>
    </div>
  )
}
