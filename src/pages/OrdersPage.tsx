import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, changeOrderStatus, changePaymentStatus, addItemsToOrder } from '../api/orders'
import { registerTableware } from '../api/tableware'
import { getMenuItems } from '../api/menuItems'
import type { Order } from '../types'
import { CheckCircle, XCircle, Clock, MapPin, Navigation, Banknote, PlusCircle, Plus, Minus, X, Search, Archive } from 'lucide-react'

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

function AddItemsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<Record<number, number>>({})
  const [busqueda, setBusqueda] = useState('')

  const { data: menuItems, isLoading } = useQuery({ queryKey: ['menuItems'], queryFn: getMenuItems })

  const mutation = useMutation({
    mutationFn: () => addItemsToOrder(order.id, Object.entries(items).map(([id, qty]) => ({ articuloId: Number(id), cantidad: qty }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] })
      onClose()
    },
  })

  const changeQty = (articuloId: number, delta: number) => {
    setItems(prev => {
      const next = (prev[articuloId] ?? 0) + delta
      if (next <= 0) { const { [articuloId]: _, ...rest } = prev; return rest }
      return { ...prev, [articuloId]: next }
    })
  }

  const cantidadItems = Object.values(items).reduce((a, b) => a + b, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Agregar al pedido</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.nombreCliente}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar platillo..."
              className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading ? (
            <p className="text-center text-gray-400 py-8">Cargando menú...</p>
          ) : (
            menuItems?.filter(m => m.disponible && m.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.nombre}</p>
                  <p className="text-xs text-orange-600 font-medium">${item.precio.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(item.id, -1)} disabled={!items[item.id]}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-gray-800">{items[item.id] ?? 0}</span>
                  <button onClick={() => changeQty(item.id, 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          {mutation.isError && (
            <p className="text-xs text-red-600 mb-2">Error al agregar. Intenta de nuevo.</p>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={cantidadItems === 0 || mutation.isPending}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? 'Agregando...' : `Agregar ${cantidadItems > 0 ? `(${cantidadItems})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function TablewareModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [platos, setPlatos] = useState(1)

  const entregarMutation = useMutation({
    mutationFn: () => changeOrderStatus(order.id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const entregarConVajilla = useMutation({
    mutationFn: async () => {
      await changeOrderStatus(order.id, 1)
      await registerTableware({ orderId: order.id, itemType: 'Plato', quantityDelivered: platos })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tableware-pending'] })
      onClose()
    },
  })

  const handleSinVajilla = async () => {
    await entregarMutation.mutateAsync()
    onClose()
  }

  const isPending = entregarMutation.isPending || entregarConVajilla.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Registrar entrega</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.nombreCliente}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">¿Cuántos platos entregas con este pedido?</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setPlatos(p => Math.max(1, p - 1))}
            disabled={platos <= 1}
            className="w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-3xl font-bold text-gray-800 w-12 text-center">{platos}</span>
          <button
            onClick={() => setPlatos(p => p + 1)}
            className="w-10 h-10 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {(entregarMutation.isError || entregarConVajilla.isError) && (
          <p className="text-xs text-red-600 mb-3 text-center">Error. Intenta de nuevo.</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => entregarConVajilla.mutate()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <Archive className="w-4 h-4" />
            {entregarConVajilla.isPending ? 'Guardando...' : `Entregar + registrar ${platos} plato${platos !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={handleSinVajilla}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {entregarMutation.isPending ? 'Guardando...' : 'Entregar sin registrar vajilla'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [tab, setTab] = useState<'pendientes' | 'todos'>('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [addItemsOrder, setAddItemsOrder] = useState<Order | null>(null)
  const [tablewareOrder, setTablewareOrder] = useState<Order | null>(null)
  const queryClient = useQueryClient()

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: number }) => changeOrderStatus(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, estadoCobro }: { id: number; estadoCobro: number }) => changePaymentStatus(id, estadoCobro),
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

  const pendientes = orders?.filter(o => o.estadoCobro !== 'Cobrado' && o.estado !== 'Cancelado') ?? []
  const q = busqueda.trim().toLowerCase()
  const filtrar = (lista: Order[]) => q
    ? lista.filter(o => o.nombreCliente.toLowerCase().includes(q) ||
        o.localCliente?.toLowerCase().includes(q) ||
        o.referenciaCliente?.toLowerCase().includes(q))
    : lista
  const visibles = filtrar(tab === 'pendientes' ? pendientes : (orders ?? []))

  return (
    <div>
      {addItemsOrder && <AddItemsModal order={addItemsOrder} onClose={() => setAddItemsOrder(null)} />}
      {tablewareOrder && <TablewareModal order={tablewareOrder} onClose={() => setTablewareOrder(null)} />}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos del día</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por mesa o cliente..."
          className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-200 p-1 rounded-lg mb-5">
        <button
          onClick={() => setTab('pendientes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'pendientes' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes
          {pendientes.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold leading-none">
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('todos')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'todos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Todos ({orders?.length ?? 0})
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="text-lg font-medium">
            {tab === 'pendientes' ? 'Todo al día' : 'Sin pedidos aún'}
          </p>
          <p className="text-sm mt-1">
            {tab === 'pendientes' ? 'No hay pedidos pendientes' : 'No hay pedidos registrados hoy'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibles.map((order: Order) => {
            const status = STATUS_STYLE[order.estado] ?? STATUS_STYLE['Pendiente']
            const isPendiente = order.estado === 'Pendiente'
            const isEntregado = order.estado === 'Entregado'
            const isCobrado = order.estadoCobro === 'Cobrado'
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{order.nombreCliente}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      {order.localCliente ? (
                        <><MapPin className="w-3 h-3" />Local {order.localCliente}</>
                      ) : (
                        <><Navigation className="w-3 h-3" />{order.referenciaCliente}</>
                      )}
                      {' · '}{new Date(order.fechaPedido).toLocaleTimeString('es-MX', {
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
                  {isPendiente && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAddItemsOrder(order)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-orange-200 text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Agregar más artículos"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          order.tipoCliente === 'Externo'
                            ? setTablewareOrder(order)
                            : statusMutation.mutate({ id: order.id, estado: 1 })
                        }
                        disabled={statusMutation.isPending}
                        className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Entregar
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, estado: 2 })}
                        disabled={statusMutation.isPending}
                        className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  )}
                  {isEntregado && (
                    isCobrado ? (
                      <span className="flex items-center gap-1.5 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Banknote className="w-3.5 h-3.5" />
                        Cobrado
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddItemsOrder(order)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-orange-200 text-orange-500 hover:bg-orange-50 transition-colors"
                          title="Agregar más artículos"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => paymentMutation.mutate({ id: order.id, estadoCobro: 1 })}
                          disabled={paymentMutation.isPending}
                          className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Cobrar
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
