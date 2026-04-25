import { useQuery } from '@tanstack/react-query'
import { getDailySummary } from '../api/orders'
import { TrendingUp, MapPin } from 'lucide-react'

export default function DailySummaryPage() {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: getDailySummary,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando resumen...
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Error al cargar el resumen.
    </div>
  )

  const sinVentas = !summary || summary.clientes.length === 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Resumen del día</h1>
        {summary && (
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {new Date(summary.fecha).toLocaleDateString('es-MX', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        )}
      </div>

      {sinVentas ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Sin ventas por ahora</p>
          <p className="text-sm mt-1">Las ventas de hoy aparecerán aquí</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pedidos del día</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{summary!.totalPedidos}</p>
            </div>
            <div className="bg-orange-500 rounded-xl p-4">
              <p className="text-sm text-orange-100">Total del día</p>
              <p className="text-3xl font-bold text-white mt-1">${summary!.totalGeneral.toFixed(2)}</p>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Por cliente
          </h2>

          <div className="grid gap-3">
            {summary!.clientes.map(item => (
              <div
                key={item.clienteId}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {item.nombreCliente.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.nombreCliente}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      Local {item.numeroLocal}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-800">${item.totalACobrar.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
