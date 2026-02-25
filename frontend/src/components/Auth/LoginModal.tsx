import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, signup, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const err = mode === 'login'
      ? await login(email, password)
      : await signup(email, password)

    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      onClose()
    }
  }

  async function handleGoogle() {
    await loginWithGoogle()
    // Page will redirect — no need to close
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
          />

          {error && (
            <p className="text-xs text-red-400 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="mt-4 text-center text-xs text-gray-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
            className="text-amber-500 hover:text-amber-400 font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
