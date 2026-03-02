import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { LoginModal } from '../Auth/LoginModal'

export function MobileTabBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const navTabs = [
    {
      path: '/routes',
      label: t('nav.routes'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      path: '/journeys',
      label: t('nav.journeys'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H10.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
    {
      path: '/destinations',
      label: t('nav.regions'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: t('nav.profile'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800"
      >
        <div className="flex">
          {navTabs.map(({ path, label, icon }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/')
            const isProfile = path === '/profile'

            if (isProfile) {
              return (
                <button
                  key={path}
                  onClick={() => {
                    if (!user) {
                      setLoginOpen(true)
                    } else {
                      navigate('/profile')
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'relative flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                    isActive ? 'text-white' : 'text-gray-500',
                  ].join(' ')}
                >
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-orange-500' : 'bg-transparent'
                  }`} />
                  {icon}
                  <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                </button>
              )
            }

            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'relative flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  isActive ? 'text-white' : 'text-gray-500',
                ].join(' ')}
              >
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-orange-500' : 'bg-transparent'
                }`} />
                {icon}
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
