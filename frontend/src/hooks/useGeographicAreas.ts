import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { GeographicArea, GeoLevel } from '../types/database'

interface UseGeographicAreasState {
  areas: GeographicArea[]
  loading: boolean
  selectedArea: GeographicArea | null
  breadcrumb: GeographicArea[]
  selectArea: (area: GeographicArea | null) => void
  resetToRoot: () => void
}

// Simple cache to avoid re-fetching already-loaded areas
const areaCache = new Map<string, GeographicArea[]>()

function cacheKey(parentId: string | null, level: GeoLevel | null) {
  return `${parentId ?? 'root'}:${level ?? 'all'}`
}

export function useGeographicAreas(
  parentId: string | null = null,
  level: GeoLevel | null = null,
): UseGeographicAreasState {
  const [areas, setAreas] = useState<GeographicArea[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedArea, setSelectedArea] = useState<GeographicArea | null>(null)
  const [ancestorCache, setAncestorCache] = useState<Map<string, GeographicArea>>(new Map())

  const key = cacheKey(parentId, level)

  useEffect(() => {
    if (areaCache.has(key)) {
      setAreas(areaCache.get(key)!)
      return
    }

    setLoading(true)
    supabase
      .rpc('get_geographic_areas', {
        p_level: level ?? null,
        p_parent_id: parentId ?? null,
      } as never)
      .then(({ data, error }) => {
        if (error) {
          setLoading(false)
          return
        }
        const rows = (data ?? []) as GeographicArea[]
        areaCache.set(key, rows)

        // Cache ancestors for breadcrumb building
        setAncestorCache(prev => {
          const next = new Map(prev)
          for (const row of rows) next.set(row.id, row)
          return next
        })

        setAreas(rows)
        setLoading(false)
      })
  }, [key, parentId, level])

  // Build breadcrumb from selectedArea up to root using ancestor cache
  const breadcrumb = useMemo<GeographicArea[]>(() => {
    if (!selectedArea) return []
    const path: GeographicArea[] = []
    let current: GeographicArea | undefined = selectedArea
    const seen = new Set<string>()
    while (current && !seen.has(current.id)) {
      path.unshift(current)
      seen.add(current.id)
      if (current.parent_id) {
        current = ancestorCache.get(current.parent_id)
      } else {
        break
      }
    }
    return path
  }, [selectedArea, ancestorCache])

  const selectArea = useCallback((area: GeographicArea | null) => {
    setSelectedArea(area)
    if (area) {
      setAncestorCache(prev => {
        const next = new Map(prev)
        next.set(area.id, area)
        return next
      })
    }
  }, [])

  const resetToRoot = useCallback(() => {
    setSelectedArea(null)
  }, [])

  return { areas, loading, selectedArea, breadcrumb, selectArea, resetToRoot }
}
