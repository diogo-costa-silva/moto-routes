import { useTranslation } from 'react-i18next'
import type { RoutePOI } from '../../hooks/useRoutePOIs'

const TYPE_EMOJI: Record<string, string> = {
  viewpoint: '👁',
  restaurant: '🍽',
  fuel_station: '⛽',
  waterfall: '💧',
  village: '🏘',
  historical_site: '🏛',
}

const ASSOCIATION_CLASS: Record<string, string> = {
  on_route: 'bg-orange-500/20 text-orange-400',
  near_route: 'bg-yellow-500/20 text-yellow-400',
  detour: 'bg-purple-500/20 text-purple-400',
}

interface POIListProps {
  pois: RoutePOI[]
  onPOIClick?: (poi: RoutePOI) => void
}

export function POIList({ pois, onPOIClick }: POIListProps) {
  const { t } = useTranslation()

  const associationLabel: Record<string, string> = {
    on_route: t('poi.onRoute'),
    near_route: t('poi.nearby'),
    detour: t('poi.detour'),
  }

  if (pois.length === 0) return null

  return (
    <ul className="flex flex-col gap-2">
      {pois.map((poi) => (
        <li
          key={poi.id}
          onClick={() => onPOIClick?.(poi)}
          className={`flex items-start gap-3 rounded-lg bg-gray-800 p-3 ${onPOIClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
        >
          {/* Type icon */}
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-700 text-base">
            {TYPE_EMOJI[poi.type] ?? '📍'}
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white leading-snug truncate">{poi.name}</p>
            {poi.description && (
              <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{poi.description}</p>
            )}

            {/* Badges */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSOCIATION_CLASS[poi.association_type] ?? 'bg-gray-700 text-gray-400'}`}
              >
                {associationLabel[poi.association_type] ?? poi.association_type}
              </span>
              {poi.km_marker != null && (
                <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                  km {poi.km_marker.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
