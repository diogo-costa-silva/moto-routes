import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGE_COLORS } from '../Map/mapLayers'
import type { Journey, JourneyStage } from '../../hooks/useJourneys'
import { useSheetDrag } from '../../hooks/useSheetDrag'

interface JourneyDetailsProps {
  journey: Journey
  stages: JourneyStage[]
  selectedStage: JourneyStage | null
  loadingStages: boolean
  stagesError?: string | null
  onClose: () => void
  onStageSelect: (stage: JourneyStage) => void
  onHeightChange?: (vh: number) => void
}

function generateGpx(name: string, slug: string, geometry: GeoJSON.LineString): void {
  const trkpts = (geometry.coordinates as [number, number][])
    .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join('\n')

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Moto Routes" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`

  const blob = new Blob([content], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${slug}.gpx`
  anchor.click()
  URL.revokeObjectURL(url)
}

function generateMergedGpx(journey: Journey, stages: JourneyStage[]): void {
  const tracks = stages
    .filter((s) => s.route.geometry_geojson != null)
    .map((s) => {
      const name = s.stage_name ?? s.route.name
      const trkpts = (s.route.geometry_geojson.coordinates as [number, number][])
        .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
        .join('\n')
      return `  <trk>\n    <name>${name}</name>\n    <trkseg>\n${trkpts}\n    </trkseg>\n  </trk>`
    })
    .join('\n')

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Moto Routes" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${journey.name}</name></metadata>
${tracks}
</gpx>`

  const blob = new Blob([content], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${journey.slug}.gpx`
  anchor.click()
  URL.revokeObjectURL(url)
}

function SkeletonStage() {
  return (
    <div className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-900">
      <div className="h-3 w-3 rounded-full bg-gray-700 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 w-2/3 rounded bg-gray-700 mb-1.5" />
        <div className="h-2.5 w-1/3 rounded bg-gray-800" />
      </div>
    </div>
  )
}

export function JourneyDetails({
  journey,
  stages,
  selectedStage,
  loadingStages,
  stagesError,
  onClose,
  onStageSelect,
}: JourneyDetailsProps) {
  const { t } = useTranslation()
  const totalKm = stages.reduce((sum, s) => sum + (s.route.distance_km ?? 0), 0)

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            {t('journey.journey')}
          </p>
          <h2 className="text-lg font-bold text-white leading-tight">{journey.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 rounded-full p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label={t('common.back')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      {journey.description && (
        <p className="text-sm text-gray-400 leading-relaxed">{journey.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {totalKm > 0 && (
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <p className="text-lg font-bold text-white">{totalKm.toFixed(0)} km</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('journey.total')}</p>
          </div>
        )}
        {journey.suggested_days != null && (
          <div className="rounded-lg bg-gray-800 p-3 text-center">
            <p className="text-lg font-bold text-white">{journey.suggested_days}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('journey.days')}</p>
          </div>
        )}
      </div>

      {/* Merged GPX download */}
      {stages.length > 0 && (
        <button
          onClick={() => generateMergedGpx(journey, stages)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-semibold text-sm px-4 py-2.5 transition-colors whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {t('journey.downloadMergedGpx')} ({totalKm.toFixed(0)} km)
        </button>
      )}

      {/* Stages */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {t('journey.stages')}
        </h3>

        <div className="space-y-1.5">
          {loadingStages
            ? Array.from({ length: 2 }).map((_, i) => <SkeletonStage key={i} />)
            : stagesError
              ? <p className="text-sm text-red-400 p-3">{stagesError}</p>
              : stages.map((stage) => {
                const color = STAGE_COLORS[(stage.stage_order - 1) % STAGE_COLORS.length]
                const isSelected = selectedStage?.id === stage.id
                const stageName = stage.stage_name ?? stage.route.name

                return (
                  <div
                    key={stage.id}
                    className={[
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      isSelected ? 'bg-gray-800' : 'hover:bg-gray-900',
                    ].join(' ')}
                    onClick={() => onStageSelect(stage)}
                  >
                    {/* Stage colour dot */}
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    {/* Stage info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{stageName}</p>
                      <p className="text-xs text-gray-500">
                        {t('journey.stage')} {stage.stage_order}
                        {stage.route.distance_km != null &&
                          ` · ${stage.route.distance_km.toFixed(0)} km`}
                        {stage.route.elevation_gain != null &&
                          ` · ↑${stage.route.elevation_gain.toFixed(0)} m`}
                      </p>
                    </div>

                    {/* GPX download */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        generateGpx(stageName, stage.route.slug, stage.route.geometry_geojson)
                      }}
                      className="flex-shrink-0 rounded p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                      aria-label={`${t('route.downloadGpx')} — ${stageName}`}
                      title={t('route.downloadGpx')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )
              })}
        </div>
      </section>
    </div>
  )
}

export function JourneyDetailsMobile({
  journey,
  stages,
  selectedStage,
  loadingStages,
  stagesError,
  onClose,
  onStageSelect,
  onHeightChange,
}: JourneyDetailsProps) {
  const { height, sheetRef, toggleSnap, dragHandlers } = useSheetDrag({
    snapPoints: [65, 92],
    onDismiss: onClose,
  })

  useEffect(() => {
    onHeightChange?.(height)
  }, [height])

  return (
    <div
      ref={sheetRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 rounded-t-2xl z-20 flex flex-col overflow-hidden"
      style={{ height: `${height}vh` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle — drag restricted here */}
      <div
        style={{ touchAction: 'none' }}
        {...dragHandlers}
        onClick={toggleSnap}
        className="flex w-full items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <div className="mx-auto h-1 w-12 rounded-full bg-gray-700" />
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <JourneyDetails
          journey={journey}
          stages={stages}
          selectedStage={selectedStage}
          loadingStages={loadingStages}
          stagesError={stagesError}
          onClose={onClose}
          onStageSelect={onStageSelect}
        />
      </div>
    </div>
  )
}
