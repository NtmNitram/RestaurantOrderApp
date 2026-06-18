import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, type LoginRequest } from '../api/auth'
import { tokenStore } from '../api/tokenStore'

function parseFeatureFlags(token: string | null): { packageOptions: boolean } {
  if (!token) return { packageOptions: false }
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(decoded) as Record<string, unknown>
    const raw = claims['featureFlags']
    // El claim JWT llega siempre como string — hay que parsearlo.
    const ff = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (ff && typeof ff === 'object') {
      return { packageOptions: !!((ff as Record<string, unknown>)['packageOptions']) }
    }
  } catch { /* ignore */ }
  return { packageOptions: false }
}

interface AuthState {
  token: string | null
  role: string | null
  username: string | null
  featureFlags: { packageOptions: boolean }
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isInitializing: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username'),
    featureFlags: { packageOptions: false },
  })
  const [isInitializing, setIsInitializing] = useState(!!localStorage.getItem('role'))

  useEffect(() => {
    tokenStore.register((token) => setAuth(prev => ({ ...prev, token, featureFlags: parseFeatureFlags(token) })))

    if (localStorage.getItem('role') && !tokenStore.get()) {
      apiRefresh()
        .then(result => {
          tokenStore.set(result.token)
          localStorage.setItem('role', result.role)
          localStorage.setItem('username', result.username)
          setAuth({ token: result.token, role: result.role, username: result.username, featureFlags: parseFeatureFlags(result.token) })
        })
        .catch(() => {
          tokenStore.set(null)
          localStorage.removeItem('role')
          localStorage.removeItem('username')
          setAuth({ token: null, role: null, username: null, featureFlags: { packageOptions: false } })
        })
        .finally(() => setIsInitializing(false))
    }

    return () => tokenStore.register(() => {})
  }, [])

  const login = async (data: LoginRequest) => {
    const result = await apiLogin(data)
    tokenStore.set(result.token)
    localStorage.setItem('role', result.role)
    localStorage.setItem('username', result.username)
    setAuth({ token: result.token, role: result.role, username: result.username, featureFlags: parseFeatureFlags(result.token) })
  }

  const logout = async () => {
    try { await apiLogout() } catch { /* continuar aunque falle */ }
    tokenStore.set(null)
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setAuth({ token: null, role: null, username: null, featureFlags: { packageOptions: false } })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.role, isInitializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
