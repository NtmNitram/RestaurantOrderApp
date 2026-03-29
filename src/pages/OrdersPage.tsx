import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, changeOrderStatus } from '../api/orders'
import type { Order } from '../types'

const STATUS_LABEL: Record<number, string> = {
  0: 'Pendiente',
  1: 'Entregado',
  2: 'Cancelado',
}

const STATUS_COLOR: Record<number, string> = {
  0: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  2: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => changeOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  if (isLoading) return <p className="text-gray-500">Cargando pedidos...</p>
  if (isError) return <p className="text-red-500">Error al cargar pedidos.</p>

  // Filtramos solo los pedidos de hoy
  const today = new Date().toDateString()
  const todayOrders = orders?.filter(o => new Date(o.orderDate).toDateString() === today) ?? []
  const active = todayOrders.filter(o => o.status === 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Pedidos del día</h1>

      {active.length === 0 ? (
        <p className="text-gray-500">No hay pedidos pendientes.</p>
      ) : (
        <div className="grid gap-3">
          {active.map((order: Order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{order.clientName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <ul className="text-sm text-gray-600 mb-3 space-y-1">
                {order.orderDetails.map(d => (
                  <li key={d.id}>
                    {d.quantity}x {d.menuItemName} — ${d.subtotal.toFixed(2)}
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="text-sm text-gray-500 italic mb-3">Nota: {order.notes}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">Total: ${order.total.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => mutation.mutate({ id: order.id, status: 1 })}
                    disabled={mutation.isPending}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Entregar
                  </button>
                  <button
                    onClick={() => mutation.mutate({ id: order.id, status: 2 })}
                    disabled={mutation.isPending}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
