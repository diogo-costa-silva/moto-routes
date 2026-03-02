import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { LanguageSwitcher } from '../components/AppShell/LanguageSwitcher'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useHistory } from '../hooks/useHistory'
import type { Route } from '../hooks/useRoutes'

function RouteCard({ route, subtitle, onClick }: { route: Route; subtitle?: string; onClick: () => void }) {
  const { t } = useTranslation()
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
            {t(`landscape.${route.landscape_type}`, { defaultValue: route.landscape_type })}
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

function relativeTime(iso: string, t: TFunction, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('profile.justNow')
  if (mins < 60) return t('profile.minutesAgo_one', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('profile.hoursAgo_one', { count: hrs })
  const days = Math.floor(hrs / 24)
  if (days < 7) return t('profile.daysAgo_one', { count: days })
  return new Date(iso).toLocaleDateString(lang)
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { favoriteRoutes, loading: favLoading } = useFavorites()
  const { entries, loading: histLoading } = useHistory()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'favourites' | 'history'>('favourites')

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info(t('profile.signInToView'))
      navigate('/routes', { replace: true })
    }
  }, [authLoading, user, navigate, t])

  if (authLoading || !user) return null

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white">
      <NavHeader />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Profile header */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">{t('profile.signedInAs')}</p>
            <p className="text-sm font-medium text-white">{user?.email}</p>
          </div>

          {/* Tab switcher */}
          <div role="tablist" aria-label={t('profile.sections')} className="flex gap-1 mb-6 bg-gray-900 rounded-full p-1 border border-gray-800">
            <button
              role="tab"
              id="tab-favourites"
              aria-selected={tab === 'favourites'}
              aria-controls="panel-favourites"
              onClick={() => setTab('favourites')}
              className={[
                'flex-1 py-1.5 rounded-full text-sm font-medium transition-colors',
                tab === 'favourites' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {t('profile.favourites')} ({favoriteRoutes.length})
            </button>
            <button
              role="tab"
              id="tab-history"
              aria-selected={tab === 'history'}
              aria-controls="panel-history"
              onClick={() => setTab('history')}
              className={[
                'flex-1 py-1.5 rounded-full text-sm font-medium transition-colors',
                tab === 'history' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {t('profile.history')}{entries.length > 0 && ` (${entries.length})`}
            </button>
          </div>

          {/* Favourites tab */}
          <div role="tabpanel" id="panel-favourites" aria-labelledby="tab-favourites" hidden={tab !== 'favourites'}>
            <div className="flex flex-col gap-2">
              {favLoading ? (
                Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              ) : favoriteRoutes.length === 0 ? (
                <EmptyState
                  icon="♡"
                  title={t('profile.noFavourites')}
                  body={t('profile.noFavouritesBody')}
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
          </div>

          {/* History tab */}
          <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={tab !== 'history'}>
            <div className="flex flex-col gap-2">
              {histLoading ? (
                Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              ) : entries.length === 0 ? (
                <EmptyState
                  icon="🗺"
                  title={t('profile.noHistory')}
                  body={t('profile.noHistoryBody')}
                />
              ) : (
                entries.map(entry => (
                  entry.route && (
                    <RouteCard
                      key={entry.id}
                      route={entry.route}
                      subtitle={relativeTime(entry.viewed_at, t, i18n.language)}
                      onClick={() => navigate(`/routes/${entry.route!.slug}`)}
                    />
                  )
                ))
              )}
            </div>
          </div>
          {/* Language preference */}
          <div className="mt-4 border-t border-gray-800 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              {t('profile.language')}
            </h3>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}
