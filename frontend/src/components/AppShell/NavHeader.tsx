import { Link, useLocation } from 'react-router'

const NAV_SECTIONS = [
  { path: '/routes', label: 'Routes' },
  { path: '/journeys', label: 'Journeys' },
  { path: '/destinations', label: 'Regions' },
]

export function NavHeader() {
  const { pathname } = useLocation()

  return (
    <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3 flex-shrink-0 min-w-0">
      <Link to="/" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap">
        Moto Routes
      </Link>

      <span className="text-gray-700">|</span>

      <nav className="flex gap-3">
        {NAV_SECTIONS.map(({ path, label }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')
          return (
            <Link
              key={path}
              to={path}
              className={[
                'text-sm transition-colors whitespace-nowrap',
                isActive ? 'font-semibold text-white' : 'text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
