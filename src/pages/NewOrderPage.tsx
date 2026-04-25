import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems } from '../api/menuItems'
import { getClients } from '../api/clients'
import { createOrder } from '../api/orders'
import { ArrowLeft, Plus, Minus, ShoppingBag } from 'lucide-react'

export default function NewOrderPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [items, setItems] = useState<Record<number, number>>({})
  const [notas, setNotas] = useState('')

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: menuItems, isLoading } = useQuery({ queryKey: ['menuItems'], queryFn: getMenuItems })

  const client = clients?.find(c => c.id === Number(clientId))

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] })
      navigate('/pedidos')
    },
  })

  const changeQty = (articuloId: number, delta: number) => {
    setItems(prev => {
      const current = prev[articuloId] ?? 0
      const next = current + delta
      if (next <= 0) {
        const { [articuloId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [articuloId]: next }
    })
  }

  const handleSubmit = () => {
    const articulos = Object.entries(items).map(([id, qty]) => ({
      articuloId: Number(id),
      cantidad: qty,
    }))
    if (articulos.length === 0) return
    mutation.mutate({ clienteId: Number(clientId), notas, articulos })
  }

  const total = menuItems
    ? Object.entries(items).reduce((sum, [id, qty]) => {
        const item = menuItems.find(m => m.id === Number(id))
        return sum + (item?.precio ?? 0) * qty
      }, 0)
    : 0

  const cantidadItems = Object.values(items).reduce((a, b) => a + b, 0)

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando menú...
    </div>
  )

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Nuevo pedido</h1>
        <p className="text-sm text-gray-500 mt-1">
          {client?.nombre} · Local {client?.numeroLocal}
        </p>
      </div>

      <div className="grid gap-3 mb-4">
        {menuItems?.filter(m => m.disponible).map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-gray-800">{item.nombre}</p>
              <p className="text-sm text-orange-600 font-medium mt-0.5">${item.precio.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeQty(item.id, -1)}
                disabled={!items[item.id]}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-bold text-gray-800">{items[item.id] ?? 0}</span>
              <button
                onClick={() => changeQty(item.id, 1)}
                className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        placeholder="Notas del pedido (opcional)"
        className="w-full border border-gray-300 rounded-xl p-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
        rows={2}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{cantidadItems} artículo(s)</p>
          <p className="text-xl font-bold text-gray-800">${total.toFixed(2)}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={cantidadItems === 0 || mutation.isPending}
          className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {mutation.isPending ? 'Enviando...' : 'Confirmar pedido'}
        </button>
      </div>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mt-3">
          Error al crear el pedido. Intenta de nuevo.
        </div>
      )}
    </div>
  )
}
