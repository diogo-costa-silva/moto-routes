import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Route } from './useRoutes'
import { useAuth } from './useAuth'

export interface HistoryEntry {
  id: string
  route_id: string
  viewed_at: string
  route: Route | null
}

interface HistoryRow {
  id: string
  route_id: string
  viewed_at: string | null
  routes: unknown
}

interface UseHistoryState {
  entries: HistoryEntry[]
  loading: boolean
  recordView: (routeId: string) => void
}

function parseRows(rows: HistoryRow[]): HistoryEntry[] {
  return rows.map(row => ({
    id: row.id,
    route_id: row.route_id,
    viewed_at: row.viewed_at ?? new Date().toISOString(),
    route: row.routes as Route | null,
  }))
}

export function useHistory(): UseHistoryState {
  const { user } = useAuth()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setEntries([])
      return
    }

    setLoading(true)
    supabase
      .from('user_history')
      .select('id, route_id, viewed_at, routes(*)')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          setLoading(false)
          return
        }
        // Cast needed: Supabase TS generics resolve join results as `never`
        setEntries(parseRows((data as unknown) as HistoryRow[]))
        setLoading(false)
      })
  }, [user])

  function refreshHistory(userId: string) {
    supabase
      .from('user_history')
      .select('id, route_id, viewed_at, routes(*)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEntries(parseRows((data as unknown) as HistoryRow[]))
      })
  }

  function recordView(routeId: string): void {
    if (!user) return

    // Cast needed: RLS table insert generics resolve as `never`
    supabase
      .from('user_history')
      .insert({ user_id: user.id, route_id: routeId } as never)
      .then(() => refreshHistory(user.id))
  }

  return { entries, loading, recordView }
}
