import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoutePOI } from '../../hooks/useRoutePOIs'
import type { Route } from '../../hooks/useRoutes'
import { FavoriteButton } from './FavoriteButton'
import { POIList } from './POIList'

interface RouteDetailsProps {
  route: Route
  onClose: () => void
  pois?: RoutePOI[]
  isFavorite?: boolean
  isAuthenticated?: boolean
  onToggleFavorite?: () => void
  onLoginRequired?: () => void
}

function generateGpx(route: Route): string {
  const trkpts = route.geometry_geojson.coordinates
    .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Moto Routes" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${route.name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function downloadGpx(route: Route) {
  const content = generateGpx(route)
  const blob = new Blob([content], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${route.slug}.gpx`
  anchor.click()
  URL.revokeObjectURL(url)
}

interface StatProps {
  label: string
  value: string | null
}

function Stat({ label, value }: StatProps) {
  if (value == null) return null
  return (
    <div className="rounded-lg bg-gray-800 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}

export function RouteDetails({ route, onClose, pois, isFavorite, isAuthenticated, onToggleFavorite, onLoginRequired }: RouteDetailsProps) {
  return (
    /* Mobile: bottom sheet */
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[55vh] bg-gray-950 border-t border-gray-800 rounded-t-2xl overflow-y-auto z-20">
      <div className="mx-auto mt-2 mb-4 h-1 w-12 rounded-full bg-gray-700" />
      <div className="pb-20">
        <DetailsContent route={route} onClose={onClose} pois={pois} isFavorite={isFavorite} isAuthenticated={isAuthenticated} onToggleFavorite={onToggleFavorite} onLoginRequired={onLoginRequired} />
      </div>
    </div>
  )
}

export { DetailsContent }

function DetailsContent({ route, onClose, pois, isFavorite = false, isAuthenticated = false, onToggleFavorite, onLoginRequired }: RouteDetailsProps) {
  const { t } = useTranslation()
  const [gpxLoading, setGpxLoading] = useState(false)

  async function handleDownloadGpx() {
    setGpxLoading(true)
    try {
      downloadGpx(route)
    } finally {
      setGpxLoading(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1">
            {route.code}
          </p>
          <h2 className="text-lg font-bold text-white leading-tight">{route.name}</h2>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {onToggleFavorite && (
            <FavoriteButton
              routeId={route.id}
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
              isAuthenticated={isAuthenticated}
              onLoginRequired={onLoginRequired ?? (() => {})}
            />
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label={t('common.close')}
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
      </div>

      <div className="flex flex-wrap gap-2">
        {route.landscape_type && (
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
            {t(`landscape.${route.landscape_type}`, { defaultValue: route.landscape_type })}
          </span>
        )}
        {route.surface && (
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300 capitalize">
            {route.surface}
          </span>
        )}
        {route.difficulty && (
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-400 capitalize">
            {route.difficulty}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          label={t('route.distance')}
          value={route.distance_km != null ? `${route.distance_km.toFixed(0)} km` : null}
        />
        <Stat
          label={t('route.elevationGain')}
          value={route.elevation_gain != null ? `${route.elevation_gain.toFixed(0)} m` : null}
        />
        <Stat
          label={t('route.maxElevation')}
          value={route.elevation_max != null ? `${route.elevation_max.toFixed(0)} m` : null}
        />
        <Stat
          label={t('route.totalCurves')}
          value={route.curve_count_total != null ? String(route.curve_count_total) : null}
        />
      </div>

      {pois && pois.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            {t('route.pointsOfInterest')}
          </h3>
          <POIList pois={pois} />
        </section>
      )}

      <button
        onClick={handleDownloadGpx}
        disabled={gpxLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {gpxLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {t('route.downloadGpx')}
      </button>
    </div>
  )
}
