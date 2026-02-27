import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Route } from './useRoutes'
import { useAuth } from './useAuth'

interface FavoriteRow {
  route_id: string
  routes: unknown
}

interface UseFavoritesState {
  favoriteIds: Set<string>
  favoriteRoutes: Route[]
  isFavorite: (routeId: string) => boolean
  toggleFavorite: (routeId: string) => Promise<void>
  loading: boolean
}

export function useFavorites(): UseFavoritesState {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoriteRoutes, setFavoriteRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      setFavoriteRoutes([])
      return
    }

    setLoading(true)
    supabase
      .from('user_favorites')
      .select('route_id, routes(*)')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load favourites')
          setLoading(false)
          return
        }

        // Cast needed: Supabase TS generics resolve join results as `never`
        const rows = (data as unknown) as FavoriteRow[]
        const ids = new Set<string>()
        const routes: Route[] = []

        for (const fav of rows ?? []) {
          ids.add(fav.route_id)
          const r = fav.routes as Route | null
          if (r) routes.push(r)
        }

        setFavoriteIds(ids)
        setFavoriteRoutes(routes)
        setLoading(false)
      })
  }, [user])

  async function toggleFavorite(routeId: string): Promise<void> {
    if (!user) {
      toast.error('Sign in to save favourites')
      return
    }

    const wasFavorite = favoriteIds.has(routeId)

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (wasFavorite) next.delete(routeId)
      else next.add(routeId)
      return next
    })

    if (wasFavorite) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('route_id', routeId)

      if (error) {
        setFavoriteIds(prev => { const next = new Set(prev); next.add(routeId); return next })
        toast.error('Failed to remove favourite')
      } else {
        setFavoriteRoutes(prev => prev.filter(r => r.id !== routeId))
        toast.success('Removed from favourites')
      }
    } else {
      const { error } = await supabase
        .from('user_favorites')
        // Cast needed: RLS table insert generics resolve as `never`
        .insert({ user_id: user.id, route_id: routeId } as never)

      if (error) {
        setFavoriteIds(prev => { const next = new Set(prev); next.delete(routeId); return next })
        toast.error('Failed to save favourite')
      } else {
        toast.success('Saved to favourites')
      }
    }
  }

  return {
    favoriteIds,
    favoriteRoutes,
    isFavorite: (routeId: string) => favoriteIds.has(routeId),
    toggleFavorite,
    loading,
  }
}
