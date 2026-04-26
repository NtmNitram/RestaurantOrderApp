import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ClientsPage from './pages/ClientsPage'
import NewOrderPage from './pages/NewOrderPage'
import OrdersPage from './pages/OrdersPage'
import DailySummaryPage from './pages/DailySummaryPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/clientes" replace />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="nuevo-pedido/:clientId" element={<NewOrderPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route
              path="resumen"
              element={
                <ProtectedRoute role="Dueño">
                  <DailySummaryPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
