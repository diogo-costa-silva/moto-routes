import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export interface RoutePOI {
  id: string
  name: string
  type: string
  description: string | null
  association_type: 'on_route' | 'near_route' | 'detour'
  distance_meters: number | null
  km_marker: number | null
  longitude: number
  latitude: number
}

interface UseRoutePOIsState {
  pois: RoutePOI[]
  loading: boolean
  selectedPOI: RoutePOI | null
  selectPOI: (poi: RoutePOI | null) => void
}

export function useRoutePOIs(routeId: string | null): UseRoutePOIsState {
  const [pois, setPois] = useState<RoutePOI[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPOI, setSelectedPOI] = useState<RoutePOI | null>(null)

  useEffect(() => {
    if (!routeId) {
      setPois([])
      setSelectedPOI(null)
      return
    }

    setLoading(true)
    setSelectedPOI(null)

    // Cast needed: Supabase RPC generics default Args to `never`, preventing argument inference
    supabase
      .rpc('get_pois_for_route', { p_route_id: routeId } as never)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load POIs')
          setLoading(false)
          return
        }

        const rows = (data ?? []) as RoutePOI[]
        setPois(rows)
        setLoading(false)
      })
  }, [routeId])

  return { pois, loading, selectedPOI, selectPOI: setSelectedPOI }
}
