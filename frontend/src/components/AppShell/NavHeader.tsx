import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LoginModal } from '../Auth/LoginModal'
import { UserMenu } from '../Auth/UserMenu'
import { useAuth } from '../../hooks/useAuth'

export function NavHeader() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const navSections = [
    { path: '/routes', label: t('nav.routes') },
    { path: '/journeys', label: t('nav.journeys') },
    { path: '/destinations', label: t('nav.regions') },
  ]

  return (
    <>
      <div className="hidden lg:flex items-center justify-between border-b border-gray-800 px-4 py-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" aria-label="Moto Routes home" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950">
            <svg
              className="h-6 w-6 text-gray-400 hover:text-white transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <circle cx="5.5" cy="17" r="2.5" />
              <circle cx="18.5" cy="17" r="2.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h7M5.5 17l1-6h5l2 4h2.5M13 11l-1.5-5H8.5" />
              <path strokeLinecap="round" d="M3 11h2" />
            </svg>
          </Link>

          <span className="hidden lg:block text-gray-700">|</span>

          <nav className="hidden lg:flex gap-3 min-w-0">
            {navSections.map(({ path, label }) => {
              const isActive = pathname === path || pathname.startsWith(path + '/')
              return (
                <Link
                  key={path}
                  to={path}
                  className={[
                    'rounded text-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
                    isActive ? 'font-semibold text-white' : 'text-gray-500 hover:text-gray-300',
                  ].join(' ')}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <LanguageSwitcher />
          {user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded text-xs font-medium text-gray-400 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
