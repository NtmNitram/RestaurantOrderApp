import { NavLink, Outlet } from 'react-router-dom'

// Outlet es como <router-outlet> en Angular — renderiza la página activa
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-bold text-gray-800 text-lg">Restaurante</span>
          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
            }
          >
            Clientes
          </NavLink>
          <NavLink
            to="/pedidos"
            className={({ isActive }) =>
              isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
            }
          >
            Pedidos
          </NavLink>
          <NavLink
            to="/resumen"
            className={({ isActive }) =>
              isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
            }
          >
            Resumen del día
          </NavLink>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
