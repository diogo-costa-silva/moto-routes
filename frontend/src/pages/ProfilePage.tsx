import { useState } from 'react'
import { useNavigate } from 'react-router'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'
import type { Route } from '../hooks/useRoutes'
import { LANDSCAPE_LABELS } from '../lib/labels'

function RouteCard({ route, subtitle, onClick }: { route: Route; subtitle?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/60 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-0.5">{route.code}</p>
        <p className="text-sm font-semibold text-white truncate">{route.name}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {route.distance_km != null && (
          <span className="text-xs text-gray-400">{route.distance_km.toFixed(0)} km</span>
        )}
        {route.landscape_type && (
          <span className="text-xs text-gray-600">
            {LANDSCAPE_LABELS[route.landscape_type] ?? route.landscape_type}
          </span>
        )}
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="w-full p-3 rounded-xl bg-gray-900 border border-gray-800 animate-pulse">
      <div className="h-3 w-16 rounded bg-gray-800 mb-2" />
      <div className="h-4 w-3/4 rounded bg-gray-800" />
    </div>
  )
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-white font-semibold mb-1">{title}</p>
      <p className="text-sm text-gray-500">{body}</p>
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { favoriteRoutes, loading: favLoading } = useFavorites()
  const { entries, loading: histLoading } = useHistory()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'favourites' | 'history'>('favourites')

  // Redirect unauthenticated users (wait for auth to resolve first)
  if (!authLoading && !user) {
    navigate('/routes', { replace: true })
    return null
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white">
      <NavHeader />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Profile header */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">Signed in as</p>
            <p className="text-sm font-medium text-white">{user?.email}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-6 bg-gray-900 rounded-full p-1 border border-gray-800">
            {(['favourites', 'history'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'flex-1 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                  tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300',
                ].join(' ')}
              >
                {t === 'favourites' ? `Favourites (${favoriteRoutes.length})` : 'History'}
              </button>
            ))}
          </div>

          {/* Favourites tab */}
          {tab === 'favourites' && (
            <div className="flex flex-col gap-2">
              {favLoading ? (
                Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              ) : favoriteRoutes.length === 0 ? (
                <EmptyState
                  icon="♡"
                  title="No favourites yet"
                  body="Heart a route while browsing to save it here."
                />
              ) : (
                favoriteRoutes.map(route => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onClick={() => navigate(`/routes/${route.slug}`)}
                  />
                ))
              )}
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div className="flex flex-col gap-2">
              {histLoading ? (
                Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              ) : entries.length === 0 ? (
                <EmptyState
                  icon="🗺"
                  title="No routes viewed yet"
                  body="Routes you open will appear here."
                />
              ) : (
                entries.map(entry => (
                  entry.route && (
                    <RouteCard
                      key={entry.id}
                      route={entry.route}
                      subtitle={relativeTime(entry.viewed_at)}
                      onClick={() => navigate(`/routes/${entry.route!.slug}`)}
                    />
                  )
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}
