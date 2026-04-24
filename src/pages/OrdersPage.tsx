import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, changeOrderStatus } from '../api/orders'
import type { Order } from '../types'

const STATUS_COLOR: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800',
  Entregado: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const mutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: number }) => changeOrderStatus(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  if (isLoading) return <p className="text-gray-500">Cargando pedidos...</p>
  if (isError) return <p className="text-red-500">Error al cargar pedidos.</p>

  const pendientes = orders?.filter(o => o.estado === 'Pendiente') ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Pedidos del día</h1>

      {pendientes.length === 0 ? (
        <p className="text-gray-500">No hay pedidos pendientes.</p>
      ) : (
        <div className="grid gap-3">
          {pendientes.map((order: Order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{order.nombreCliente}</p>
                  <p className="text-sm text-gray-500">
                    Local {order.localCliente} · {new Date(order.fechaPedido).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.estado] ?? ''}`}>
                  {order.estado}
                </span>
              </div>

              <ul className="text-sm text-gray-600 mb-3 space-y-1">
                {order.articulos.map(d => (
                  <li key={d.id}>
                    {d.cantidad}x {d.nombreArticulo} — ${d.subtotal.toFixed(2)}
                  </li>
                ))}
              </ul>

              {order.notas && (
                <p className="text-sm text-gray-500 italic mb-3">Nota: {order.notas}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">Total: ${order.total.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => mutation.mutate({ id: order.id, estado: 1 })}
                    disabled={mutation.isPending}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Entregar
                  </button>
                  <button
                    onClick={() => mutation.mutate({ id: order.id, estado: 2 })}
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
