import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthUser {
  id: string
  email: string | undefined
  user_metadata: {
    avatar_url?: string
    full_name?: string
    name?: string
  }
}

interface UseAuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      avatar_url: user.user_metadata?.avatar_url,
      full_name: user.user_metadata?.full_name,
      name: user.user_metadata?.name,
    },
  }
}

export function useAuth(): UseAuthState {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session without waiting for onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? toAuthUser(session.user) : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signup(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  async function loginWithGoogle(): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    })
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  return { user, loading, login, signup, loginWithGoogle, logout }
}
