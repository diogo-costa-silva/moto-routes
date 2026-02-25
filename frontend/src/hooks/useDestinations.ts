import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { LandscapeType } from '../types/database'

export interface Destination {
  id: string
  name: string
  slug: string
  description: string | null
  bounding_box_geojson: GeoJSON.Polygon
}

export interface DestinationRoute {
  id: string
  name: string
  code: string
  distance_km: number | null
  elevation_gain: number | null
  landscape_type: LandscapeType | null
  geometry_geojson: GeoJSON.LineString
  display_order: number | null
}

interface UseDestinationsState {
  destinations: Destination[]
  loadingDestinations: boolean
  error: string | null
  selectedDestination: Destination | null
  selectDestination: (d: Destination | null) => void
  featuredRoutes: DestinationRoute[]
  loadingRoutes: boolean
}

function isPolygon(value: unknown): value is GeoJSON.Polygon {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return obj['type'] === 'Polygon' && Array.isArray(obj['coordinates'])
}

function isLineString(value: unknown): value is GeoJSON.LineString {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return obj['type'] === 'LineString' && Array.isArray(obj['coordinates'])
}

export function useDestinations(): UseDestinationsState {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [featuredRoutes, setFeaturedRoutes] = useState<DestinationRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)

  // Fetch all destinations on mount
  useEffect(() => {
    supabase
      .rpc('get_destinations', {} as never)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load destinations')
          setError('Failed to load destinations')
          setLoadingDestinations(false)
          return
        }

        type RawDestRow = {
          id: string
          name: string
          slug: string
          description: string | null
          bounding_box_geojson: unknown
        }

        const parsed: Destination[] = []
        for (const row of (data ?? []) as unknown as RawDestRow[]) {
          if (!isPolygon(row.bounding_box_geojson)) continue
          parsed.push({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            bounding_box_geojson: row.bounding_box_geojson,
          })
        }

        setDestinations(parsed)
        setLoadingDestinations(false)
      })
  }, [])

  // Fetch featured routes when a destination is selected
  useEffect(() => {
    if (!selectedDestination) {
      setFeaturedRoutes([])
      return
    }

    setLoadingRoutes(true)

    supabase
      .from('destination_featured_routes')
      .select(
        'display_order, routes(id, name, code, distance_km, elevation_gain, landscape_type, geometry_geojson)',
      )
      .eq('destination_id', selectedDestination.id)
      .order('display_order')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load destination routes')
          setLoadingRoutes(false)
          return
        }

        type RawFeaturedRow = {
          display_order: number | null
          routes: {
            id: string
            name: string
            code: string
            distance_km: number | null
            elevation_gain: number | null
            landscape_type: LandscapeType | null
            geometry_geojson: unknown
          } | null
        }

        const parsed: DestinationRoute[] = []
        for (const row of (data ?? []) as unknown as RawFeaturedRow[]) {
          const r = row.routes
          if (!r || !isLineString(r.geometry_geojson)) continue
          parsed.push({
            id: r.id,
            name: r.name,
            code: r.code,
            distance_km: r.distance_km,
            elevation_gain: r.elevation_gain,
            landscape_type: r.landscape_type,
            geometry_geojson: r.geometry_geojson as GeoJSON.LineString,
            display_order: row.display_order,
          })
        }

        setFeaturedRoutes(parsed)
        setLoadingRoutes(false)
      })
  }, [selectedDestination])

  return {
    destinations,
    loadingDestinations,
    error,
    selectedDestination,
    selectDestination: setSelectedDestination,
    featuredRoutes,
    loadingRoutes,
  }
}
