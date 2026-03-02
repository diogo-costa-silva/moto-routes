import { useTranslation } from 'react-i18next'
import type { Journey } from '../../hooks/useJourneys'

interface JourneyListProps {
  journeys: Journey[]
  loading: boolean
  selectedJourney: Journey | null
  onSelect: (journey: Journey) => void
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

export function JourneyList({ journeys, loading, selectedJourney, onSelect }: JourneyListProps) {
  const { t } = useTranslation()

  const typeLabels: Record<string, string> = {
    linear: t('journey.typeLinear'),
    circular: t('journey.typeCircular'),
    loop: t('journey.typeLoop'),
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          {t('journey.heading')}
          {!loading && <span className="ml-2 font-normal text-gray-600">({journeys.length})</span>}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : journeys.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{t('journey.noJourneys')}</p>
        ) : (
          journeys.map((journey) => {
              const isSelected = selectedJourney?.id === journey.id
              return (
                <button
                  key={journey.id}
                  className={[
                    'w-full rounded-lg border text-left transition-all duration-150 p-4',
                    isSelected
                      ? 'border-orange-500 bg-gray-800 border-l-4'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800',
                  ].join(' ')}
                  onClick={() => onSelect(journey)}
                >
                  <p className="mb-2 font-semibold text-white leading-tight">{journey.name}</p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {journey.type && (
                      <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                        {typeLabels[journey.type] ?? journey.type}
                      </span>
                    )}
                    {journey.suggested_days != null && (
                      <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-xs text-orange-400">
                        {journey.suggested_days} {journey.suggested_days !== 1 ? t('journey.days_plural') : t('journey.day')}
                      </span>
                    )}
                  </div>

                  {journey.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{journey.description}</p>
                  )}
                </button>
              )
            })
        )}
      </div>
    </div>
  )
}
