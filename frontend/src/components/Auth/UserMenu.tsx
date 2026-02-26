import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { AuthUser } from '../../hooks/useAuth'

interface UserMenuProps {
  user: AuthUser
  onLogout: () => void
}

function getInitials(user: AuthUser): string {
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? '?'
  return name.slice(0, 2).toUpperCase()
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleBlur(e: React.FocusEvent) {
    if (menuRef.current && !menuRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!open) { setOpen(true); return }
      const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      if (!items?.length) return
      const current = Array.from(items).indexOf(document.activeElement as HTMLElement)
      if (e.key === 'ArrowDown') {
        items[(current + 1) % items.length]?.focus()
      } else {
        items[(current - 1 + items.length) % items.length]?.focus()
      }
      e.preventDefault()
    }
  }

  const avatarUrl = user.user_metadata.avatar_url

  return (
    <div ref={menuRef} className="relative" onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('userMenu.accountMenu')}
        className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-700"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-gray-900">
            {getInitials(user)}
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('userMenu.accountOptions')}
          className="absolute right-0 top-full mt-2 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50"
        >
          <div className="px-3 py-2 border-b border-gray-800">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/profile') }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left focus:outline-none focus-visible:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('userMenu.myProfile')}
          </button>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-left focus:outline-none focus-visible:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('userMenu.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
