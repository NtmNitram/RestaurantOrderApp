import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Users, ClipboardList, BarChart3, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getOrders } from '../api/orders'

export default function Layout() {
  const { role, username, logout } = useAuth()
  const navigate = useNavigate()
  const isDueño = role === 'Dueño'

  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: getOrders })
  const pendingCount = orders?.filter(o => o.estado === 'Pendiente').length ?? 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { to: '/pedidos', label: 'Pedidos', icon: <ClipboardList className="w-5 h-5" />, badge: pendingCount },
    ...(isDueño ? [{ to: '/resumen', label: 'Resumen', icon: <BarChart3 className="w-5 h-5" /> }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav — desktop */}
      <nav className="hidden md:block bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <UtensilsCrossed className="text-orange-400 w-6 h-6 mr-2" />
          <span className="font-bold text-white text-lg mr-6">Restaurante</span>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {link.icon}
              {link.label}
              {!!link.badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold leading-none">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {username} · <span className="text-orange-400">{role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Header — mobile */}
      <div className="md:hidden bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-orange-400 w-5 h-5" />
          <span className="font-bold text-white">Restaurante</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`
            }
          >
            <div className="relative">
              {link.icon}
              {!!link.badge && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold leading-none">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </div>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
