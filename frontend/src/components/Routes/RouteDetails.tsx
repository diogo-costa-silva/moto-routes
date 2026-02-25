import type { RoutePOI } from '../../hooks/useRoutePOIs'
import type { Route } from '../../hooks/useRoutes'
import { POIList } from './POIList'

interface RouteDetailsProps {
  route: Route
  onClose: () => void
  pois?: RoutePOI[]
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

const LANDSCAPE_LABELS: Record<string, string> = {
  coast: 'Coast',
  mountain: 'Mountain',
  forest: 'Forest',
  urban: 'Urban',
  river_valley: 'River Valley',
  mixed: 'Mixed',
  plains: 'Plains',
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

export function RouteDetails({ route, onClose, pois }: RouteDetailsProps) {
  return (
    /* Mobile: bottom sheet */
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[50vh] bg-gray-950 border-t border-gray-800 rounded-t-2xl overflow-y-auto z-20">
      <div className="mx-auto mt-2 mb-4 h-1 w-12 rounded-full bg-gray-700" />
      <DetailsContent route={route} onClose={onClose} pois={pois} />
    </div>
  )
}

export { DetailsContent }

function DetailsContent({ route, onClose, pois }: RouteDetailsProps) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1">
            {route.code}
          </p>
          <h2 className="text-xl font-bold text-white leading-tight">{route.name}</h2>
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

      <div className="flex flex-wrap gap-2">
        {route.landscape_type && (
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
            {LANDSCAPE_LABELS[route.landscape_type] ?? route.landscape_type}
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
          label="Distance"
          value={route.distance_km != null ? `${route.distance_km.toFixed(0)} km` : null}
        />
        <Stat
          label="Elevation Gain"
          value={route.elevation_gain != null ? `${route.elevation_gain.toFixed(0)} m` : null}
        />
        <Stat
          label="Max Elevation"
          value={route.elevation_max != null ? `${route.elevation_max.toFixed(0)} m` : null}
        />
        <Stat
          label="Total Curves"
          value={route.curve_count_total != null ? String(route.curve_count_total) : null}
        />
      </div>

      {pois && pois.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Points of Interest
          </h3>
          <POIList pois={pois} />
        </section>
      )}

      <button
        onClick={() => downloadGpx(route)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 active:bg-orange-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Download GPX
      </button>
    </div>
  )
}
