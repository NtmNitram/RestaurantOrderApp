import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  role?: string
}

export default function ProtectedRoute({ children, role }: Props) {
  const { isAuthenticated, role: userRole } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/clientes" replace />

  return <>{children}</>
}
