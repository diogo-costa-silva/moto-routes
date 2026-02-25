import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type RouteRow = Database['public']['Tables']['routes']['Row']

export interface RouteGeoJSON {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface Route {
  id: string
  code: string
  name: string
  slug: string
  difficulty: string | null
  landscape_type: string | null
  surface: string | null
  distance_km: number | null
  elevation_gain: number | null
  elevation_max: number | null
  elevation_min: number | null
  curve_count_total: number | null
  curve_count_sharp: number | null
  geometry_geojson: RouteGeoJSON
}

// Use unknown so the predicate is compatible with Json | null at call sites
function isRouteGeoJSON(value: unknown): value is RouteGeoJSON {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return (
    obj['type'] === 'LineString' &&
    Array.isArray(obj['coordinates']) &&
    (obj['coordinates'] as unknown[]).length > 0
  )
}


interface UseRoutesState {
  routes: Route[]
  loading: boolean
  error: string | null
  selectedRoute: Route | null
  hoveredRouteId: string | null
  selectRoute: (route: Route | null) => void
  hoverRoute: (id: string | null) => void
}

export function useRoutes(): UseRoutesState {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)

  useEffect(() => {
    // Use select('*') so Supabase TypeScript generics resolve to the full Row type
    supabase
      .from('routes')
      .select('*')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
          toast.error('Failed to load routes')
          setLoading(false)
          return
        }

        // Cast needed: Supabase TS generics return `never` for rows with `unknown` geometry column
        const rows = (data ?? []) as RouteRow[]
        const parsed: Route[] = []
        for (const row of rows) {
          if (!isRouteGeoJSON(row.geometry_geojson)) continue
          const geojson = row.geometry_geojson
          parsed.push({
            id: row.id,
            code: row.code,
            name: row.name,
            slug: row.slug,
            difficulty: row.difficulty,
            landscape_type: row.landscape_type,
            surface: row.surface,
            distance_km: row.distance_km,
            elevation_gain: row.elevation_gain,
            elevation_max: row.elevation_max,
            elevation_min: row.elevation_min,
            curve_count_total: row.curve_count_total,
            curve_count_sharp: row.curve_count_sharp,
            geometry_geojson: geojson,
          })
        }

        setRoutes(parsed)
        setLoading(false)
      })
  }, [])

  return {
    routes,
    loading,
    error,
    selectedRoute,
    hoveredRouteId,
    selectRoute: setSelectedRoute,
    hoverRoute: setHoveredRouteId,
  }
}
