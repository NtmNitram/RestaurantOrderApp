import { NavLink, Outlet } from 'react-router-dom'
import { UtensilsCrossed, Users, ClipboardList, BarChart3 } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <UtensilsCrossed className="text-orange-400 w-6 h-6 mr-2" />
          <span className="font-bold text-white text-lg mr-6">Restaurante</span>

          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Users className="w-4 h-4" />
            Clientes
          </NavLink>

          <NavLink
            to="/pedidos"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <ClipboardList className="w-4 h-4" />
            Pedidos
          </NavLink>

          <NavLink
            to="/resumen"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            Resumen
          </NavLink>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
