import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY, USER_KEY } from '../services/api'
import type { AuthResponse, User } from '../types'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Returns the JWT expiry in ms, or null if the token cannot be decoded. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function loadSession(): User | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const rawUser = localStorage.getItem(USER_KEY)
  const exp = token ? tokenExpiry(token) : null
  if (!token || !rawUser || !exp || exp <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
  return JSON.parse(rawUser) as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const login = useCallback(({ token, user }: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }, [])

  // Log out automatically when the token expires while the app is open
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const exp = token ? tokenExpiry(token) : null
    if (!user || !exp) return
    const timer = window.setTimeout(logout, Math.max(exp - Date.now(), 0))
    return () => window.clearTimeout(timer)
  }, [user, logout])

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'ADMIN', login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
