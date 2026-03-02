import { useTranslation } from 'react-i18next'
import type { RoadAlternative } from '../../types/database'

interface AlternativeSelectorProps {
  alternatives: RoadAlternative[]
  selected: RoadAlternative | null
  onSelect: (alt: RoadAlternative) => void
}

export function AlternativeSelector({ alternatives, selected, onSelect }: AlternativeSelectorProps) {
  const { t } = useTranslation()
  if (alternatives.length <= 1) return null

  return (
    <div className="border-b border-gray-800 px-3 py-2">
      <p className="text-xs text-gray-500 mb-2 px-3">{t('road.alternatives')}</p>
      <div className="flex flex-col gap-1">
        {alternatives.map((alt) => {
          const isActive = selected?.id === alt.id
          return (
            <button
              key={alt.id}
              onClick={() => onSelect(alt)}
              className={[
                'w-full text-left rounded-lg px-3 py-2 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-950 focus:ring-gray-400',
                isActive
                  ? 'bg-orange-500/20 text-orange-400 font-medium border border-orange-500/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="leading-tight">{alt.name}</span>
                {alt.is_default && !isActive && (
                  <span className="text-xs text-gray-600 flex-shrink-0">{t('road.default')}</span>
                )}
              </div>
              {(alt.distance_km != null || alt.elevation_gain != null) && (
                <div className="flex gap-3 mt-0.5 text-xs opacity-70">
                  {alt.distance_km != null && <span>{Number(alt.distance_km).toFixed(0)} km</span>}
                  {alt.elevation_gain != null && <span>↑ {alt.elevation_gain.toFixed(0)} m</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
