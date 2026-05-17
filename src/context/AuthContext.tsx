import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, type LoginRequest } from '../api/auth'
import { tokenStore } from '../api/tokenStore'

interface AuthState {
  token: string | null
  role: string | null
  username: string | null
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username'),
  })

  useEffect(() => {
    tokenStore.register((token) => setAuth(prev => ({ ...prev, token })))
    return () => tokenStore.register(() => {})
  }, [])

  const login = async (data: LoginRequest) => {
    const result = await apiLogin(data)
    tokenStore.set(result.token)
    localStorage.setItem('role', result.role)
    localStorage.setItem('username', result.username)
    setAuth({ token: result.token, role: result.role, username: result.username })
  }

  const logout = async () => {
    try { await apiLogout() } catch { /* continuar aunque falle */ }
    tokenStore.set(null)
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setAuth({ token: null, role: null, username: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.role }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
