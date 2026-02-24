import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type ConnectionStatus = 'checking' | 'ok' | 'error'

export function HomePage() {
  const [status, setStatus] = useState<ConnectionStatus>('checking')
  const [routeCount, setRouteCount] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error('Supabase connection error:', error)
          setStatus('error')
        } else {
          setRouteCount(count ?? 0)
          setStatus('ok')
        }
      })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8 text-white">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Moto Routes</h1>
      <p className="mb-8 text-gray-400">v4 — Phase 3 Routes</p>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm mb-6">
        <p className="mb-1 font-medium text-gray-300">Supabase connection</p>
        {status === 'checking' && <p className="text-yellow-400">Checking…</p>}
        {status === 'ok' && (
          <p className="text-green-400">
            Connected — {routeCount} route{routeCount !== 1 ? 's' : ''} in database
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-400">Connection failed — check console</p>
        )}
      </div>

      <a
        href="/routes"
        className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
      >
        Explore Routes →
      </a>
    </main>
  )
}
