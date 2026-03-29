import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ClientsPage from './pages/ClientsPage'
import NewOrderPage from './pages/NewOrderPage'
import OrdersPage from './pages/OrdersPage'
import DailySummaryPage from './pages/DailySummaryPage'

// BrowserRouter es como RouterModule en Angular
// Routes + Route es como el array de rutas en app.routes.ts
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/clientes" replace />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="nuevo-pedido/:clientId" element={<NewOrderPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="resumen" element={<DailySummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
