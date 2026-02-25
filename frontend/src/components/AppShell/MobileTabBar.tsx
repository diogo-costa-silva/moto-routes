import { Link, useLocation } from 'react-router'

const TABS = [
  {
    path: '/routes',
    label: 'Routes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    path: '/journeys',
    label: 'Journeys',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H10.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
]

export function MobileTabBar() {
  const { pathname } = useLocation()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800">
      <div className="flex">
        {TABS.map(({ path, label, icon }) => {
          const isActive = pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={[
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                isActive ? 'text-white' : 'text-gray-500',
              ].join(' ')}
            >
              {icon}
              <span className={isActive ? 'font-semibold' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
