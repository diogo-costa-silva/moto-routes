import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { AlternativeGeoJSON, RoadAlternative, RoadWithAlternatives } from '../types/database'

function isAlternativeGeoJSON(value: unknown): value is AlternativeGeoJSON {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return (
    (obj['type'] === 'LineString' ||
      obj['type'] === 'MultiLineString' ||
      obj['type'] === 'GeometryCollection') &&
    Array.isArray(obj['coordinates'])
  )
}

interface UseRoadsState {
  roads: RoadWithAlternatives[]
  loading: boolean
  error: string | null
  selectedRoad: RoadWithAlternatives | null
  selectedAlternative: RoadAlternative | null
  selectRoad: (road: RoadWithAlternatives | null) => void
  selectAlternative: (alt: RoadAlternative | null) => void
}

export function useRoads(): UseRoadsState {
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoad, setSelectedRoad] = useState<RoadWithAlternatives | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<RoadAlternative | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase.rpc('get_roads_with_alternatives', {} as never).then(({ data, error: err }) => {
      if (err) {
        setError(err.message)
        toast.error('Failed to load roads')
        setLoading(false)
        return
      }
      setRawRows((data ?? []) as Record<string, unknown>[])
      setLoading(false)
    })
  }, [])

  const roads = useMemo<RoadWithAlternatives[]>(() => {
    const map = new Map<string, RoadWithAlternatives>()

    for (const row of rawRows) {
      const roadId = row['road_id'] as string
      if (!map.has(roadId)) {
        map.set(roadId, {
          id: roadId,
          code: row['road_code'] as string,
          designation: (row['road_designation'] as string | null) ?? null,
          hero_image_url: null,
          country_code: (row['road_country_code'] as string | null) ?? null,
          total_distance_km: (row['road_total_distance_km'] as number | null) ?? null,
          description: null,
          alternatives: [],
          defaultAlternative: null,
          alt_count: Number(row['alt_count'] ?? 0),
        })
      }

      const road = map.get(roadId)!
      const altId = row['alt_id'] as string | null
      if (!altId) continue

      const geomRaw = row['alt_geometry_geojson']
      const alt: RoadAlternative = {
        id: altId,
        road_id: roadId,
        name: row['alt_name'] as string,
        slug: row['alt_slug'] as string,
        description: (row['alt_description'] as string | null) ?? null,
        is_default: Boolean(row['alt_is_default']),
        display_order: Number(row['alt_display_order'] ?? 0),
        distance_km: (row['alt_distance_km'] as number | null) ?? null,
        elevation_gain: (row['alt_elevation_gain'] as number | null) ?? null,
        elevation_max: (row['alt_elevation_max'] as number | null) ?? null,
        geometry_geojson: isAlternativeGeoJSON(geomRaw) ? geomRaw : null,
        created_by: null,
      }

      // Avoid duplicates (window function duplicates rows per alt×alt_count)
      if (!road.alternatives.find(a => a.id === altId)) {
        road.alternatives.push(alt)
        if (alt.is_default) road.defaultAlternative = alt
      }
    }

    // Fix alt_count after deduplication (window function inflates due to self-join)
    for (const road of map.values()) {
      road.alt_count = road.alternatives.length
    }

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [rawRows])

  function selectRoad(road: RoadWithAlternatives | null) {
    setSelectedRoad(road)
    setSelectedAlternative(road?.defaultAlternative ?? null)
  }

  return {
    roads,
    loading,
    error,
    selectedRoad,
    selectedAlternative,
    selectRoad,
    selectAlternative: setSelectedAlternative,
  }
}
