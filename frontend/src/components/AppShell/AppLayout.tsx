import { useState } from 'react'
import { Outlet } from 'react-router'
import { MapProvider } from '../../contexts/MapContext'
import { SharedMap } from '../Map/SharedMap'
import { NavHeader } from './NavHeader'
import { MobileTabBar } from './MobileTabBar'
import { LoginModal } from '../Auth/LoginModal'
import { useAuth } from '../../hooks/useAuth'
import type { AuthUser } from '../../hooks/useAuth'

export type OutletContextType = {
  onLoginOpen: () => void
  user: AuthUser | null
  isAuthenticated: boolean
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  function openLogin() {
    setLoginOpen(true)
  }

  return (
    <MapProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
        <NavHeader user={user} onLogout={logout} onLoginOpen={openLogin} />
        <div className="flex flex-1 min-h-0 relative">
          <SharedMap />
          <Outlet context={{ onLoginOpen: openLogin, user, isAuthenticated: !!user } satisfies OutletContextType} />
        </div>
        <MobileTabBar user={user} onLoginOpen={openLogin} />
        {/* Single LoginModal instance — eliminates A-03 (3 duplicate modals) */}
        <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
        />
      </div>
    </MapProvider>
  )
}
