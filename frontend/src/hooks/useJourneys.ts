import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export interface JourneyStageRoute {
  id: string
  slug: string
  name: string
  distance_km: number | null
  elevation_gain: number | null
  geometry_geojson: GeoJSON.LineString
}

export interface JourneyStage {
  id: string
  stage_order: number
  stage_name: string | null
  route: JourneyStageRoute
}

export interface Journey {
  id: string
  name: string
  slug: string
  type: string | null
  description: string | null
  suggested_days: number | null
}

interface UseJourneysState {
  journeys: Journey[]
  loadingJourneys: boolean
  error: string | null
  selectedJourney: Journey | null
  selectJourney: (j: Journey | null) => void
  stages: JourneyStage[]
  loadingStages: boolean
  stagesError: string | null
  selectedStage: JourneyStage | null
  selectStage: (s: JourneyStage | null) => void
}

function isLineString(value: unknown): value is GeoJSON.LineString {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return obj['type'] === 'LineString' && Array.isArray(obj['coordinates'])
}

export function useJourneys(): UseJourneysState {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loadingJourneys, setLoadingJourneys] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null)
  const [stages, setStages] = useState<JourneyStage[]>([])
  const [loadingStages, setLoadingStages] = useState(false)
  const [stagesError, setStagesError] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null)

  // Fetch all journeys on mount
  useEffect(() => {
    supabase
      .from('journeys')
      .select('id, name, slug, type, description, suggested_days')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load journeys')
          setError('Failed to load journeys')
          setLoadingJourneys(false)
          return
        }
        setJourneys((data ?? []) as Journey[])
        setLoadingJourneys(false)
      })
  }, [])

  // Fetch stages when a journey is selected
  useEffect(() => {
    if (!selectedJourney) {
      setStages([])
      setSelectedStage(null)
      return
    }

    setLoadingStages(true)
    setStagesError(null)
    setSelectedStage(null)

    supabase
      .from('journey_stages')
      .select(
        'id, stage_order, stage_name, routes(id, slug, name, distance_km, elevation_gain, geometry_geojson)',
      )
      .eq('journey_id', selectedJourney.id)
      .order('stage_order')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load journey stages')
          setStagesError('Failed to load journey stages')
          setLoadingStages(false)
          return
        }

        type RawStageRow = {
          id: string
          stage_order: number
          stage_name: string | null
          routes: {
            id: string
            slug: string
            name: string
            distance_km: number | null
            elevation_gain: number | null
            geometry_geojson: unknown
          } | null
        }

        const parsed: JourneyStage[] = []
        for (const row of (data ?? []) as unknown as RawStageRow[]) {
          const routeRaw = row.routes
          if (!routeRaw || !isLineString(routeRaw.geometry_geojson)) continue

          parsed.push({
            id: row.id,
            stage_order: row.stage_order,
            stage_name: row.stage_name ?? null,
            route: {
              id: routeRaw.id,
              slug: routeRaw.slug,
              name: routeRaw.name,
              distance_km: routeRaw.distance_km ?? null,
              elevation_gain: routeRaw.elevation_gain ?? null,
              geometry_geojson: routeRaw.geometry_geojson as GeoJSON.LineString,
            },
          })
        }

        setStages(parsed)
        setLoadingStages(false)
      })
  }, [selectedJourney])

  return {
    journeys,
    loadingJourneys,
    error,
    selectedJourney,
    selectJourney: setSelectedJourney,
    stages,
    loadingStages,
    stagesError,
    selectedStage,
    selectStage: setSelectedStage,
  }
}
