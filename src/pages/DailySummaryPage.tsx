import { useQuery } from '@tanstack/react-query'
import { getDailySummary } from '../api/orders'

export default function DailySummaryPage() {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: getDailySummary,
  })

  if (isLoading) return <p className="text-gray-500">Cargando resumen...</p>
  if (isError) return <p className="text-red-500">Error al cargar el resumen.</p>

  const sinVentas = !summary || summary.clientes.length === 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Resumen del día</h1>
      {summary && (
        <p className="text-sm text-gray-500 mb-4">
          {new Date(summary.fecha).toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      )}

      {sinVentas ? (
        <p className="text-gray-500">No hay ventas registradas hoy.</p>
      ) : (
        <>
          <div className="grid gap-3 mb-4">
            {summary!.clientes.map(item => (
              <div key={item.clienteId} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.nombreCliente}</p>
                  <p className="text-sm text-gray-500">Local {item.numeroLocal}</p>
                </div>
                <span className="font-bold text-gray-800">${item.totalACobrar.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-600 text-white rounded-lg p-4 flex justify-between items-center">
            <span className="font-bold text-lg">Total del día</span>
            <span className="font-bold text-xl">${summary!.totalGeneral.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  )
}
