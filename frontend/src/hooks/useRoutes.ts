import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { fetchTranslations } from '../lib/translations'
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
  description: string | null
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

export function useRoutes(lang: string = 'pt'): UseRoutesState {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)

    Promise.all([
      supabase.from('routes').select('*'),
      fetchTranslations('route', lang),
    ]).then(([{ data, error: fetchError }, translations]) => {
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
        const t = translations.get(row.id) ?? {}
        parsed.push({
          id: row.id,
          code: row.code,
          name: t['name'] ?? row.name,
          description: t['description'] ?? row.description ?? null,
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
          geometry_geojson: row.geometry_geojson as RouteGeoJSON,
        })
      }

      setRoutes(parsed)
      setLoading(false)
    })
  }, [lang])

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
