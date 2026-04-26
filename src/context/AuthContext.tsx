import { createContext, useContext, useState, type ReactNode } from 'react'
import { login as apiLogin, type LoginRequest } from '../api/auth'

interface AuthState {
  token: string | null
  role: string | null
  username: string | null
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username'),
  }))

  const login = async (data: LoginRequest) => {
    const result = await apiLogin(data)
    localStorage.setItem('token', result.token)
    localStorage.setItem('role', result.role)
    localStorage.setItem('username', result.username)
    setAuth({ token: result.token, role: result.role, username: result.username })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setAuth({ token: null, role: null, username: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
