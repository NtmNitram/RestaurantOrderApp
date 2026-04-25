import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, changeOrderStatus } from '../api/orders'
import type { Order } from '../types'
import { CheckCircle, XCircle, Clock, MapPin } from 'lucide-react'

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Pendiente: {
    bg: 'bg-yellow-100 text-yellow-800',
    text: 'Pendiente',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Entregado: {
    bg: 'bg-green-100 text-green-800',
    text: 'Entregado',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  Cancelado: {
    bg: 'bg-red-100 text-red-800',
    text: 'Cancelado',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
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

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando pedidos...
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Error al cargar pedidos.
    </div>
  )

  const pendientes = orders?.filter(o => o.estado === 'Pendiente') ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos activos</h1>
        <p className="text-sm text-gray-500 mt-1">{pendientes.length} pedido(s) pendientes</p>
      </div>

      {pendientes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="text-lg font-medium">Todo al día</p>
          <p className="text-sm mt-1">No hay pedidos pendientes</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pendientes.map((order: Order) => {
            const status = STATUS_STYLE[order.estado] ?? STATUS_STYLE['Pendiente']
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{order.nombreCliente}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      Local {order.localCliente} · {new Date(order.fechaPedido).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.bg}`}>
                    {status.icon}
                    {status.text}
                  </span>
                </div>

                <ul className="text-sm text-gray-600 mb-3 space-y-1 border-t border-gray-100 pt-3">
                  {order.articulos.map(d => (
                    <li key={d.id} className="flex justify-between">
                      <span>{d.cantidad}x {d.nombreArticulo}</span>
                      <span className="text-gray-500">${d.subtotal.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                {order.notas && (
                  <p className="text-xs text-gray-400 italic mb-3 bg-gray-50 rounded p-2">
                    Nota: {order.notas}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-800 text-lg">${order.total.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => mutation.mutate({ id: order.id, estado: 1 })}
                      disabled={mutation.isPending}
                      className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Entregar
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: order.id, estado: 2 })}
                      disabled={mutation.isPending}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
