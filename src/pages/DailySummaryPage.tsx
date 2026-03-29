import { useQuery } from '@tanstack/react-query'
import { getDailySummary } from '../api/orders'

export default function DailySummaryPage() {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: getDailySummary,
  })

  if (isLoading) return <p className="text-gray-500">Cargando resumen...</p>
  if (isError) return <p className="text-red-500">Error al cargar el resumen.</p>

  const totalDia = summary?.reduce((sum, item) => sum + item.totalAmount, 0) ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Resumen del día</h1>

      {!summary || summary.length === 0 ? (
        <p className="text-gray-500">No hay ventas registradas hoy.</p>
      ) : (
        <>
          <div className="grid gap-3 mb-4">
            {summary.map(item => (
              <div key={item.clientId} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.clientName}</p>
                  <p className="text-sm text-gray-500">{item.totalOrders} pedido(s)</p>
                </div>
                <span className="font-bold text-gray-800">${item.totalAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-600 text-white rounded-lg p-4 flex justify-between items-center">
            <span className="font-bold text-lg">Total del día</span>
            <span className="font-bold text-xl">${totalDia.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  )
}
