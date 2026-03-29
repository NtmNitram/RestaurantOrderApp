import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenuItems } from '../api/menuItems'
import { getClients } from '../api/clients'
import { createOrder } from '../api/orders'

export default function NewOrderPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // items es el carrito: { articuloId → cantidad }
  const [items, setItems] = useState<Record<number, number>>({})
  const [notas, setNotas] = useState('')

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: menuItems, isLoading } = useQuery({ queryKey: ['menuItems'], queryFn: getMenuItems })

  const client = clients?.find(c => c.id === Number(clientId))

  // useMutation es para operaciones que modifican datos (POST, PATCH, DELETE)
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalida el caché de pedidos para que se recarguen
      queryClient.invalidateQueries({ queryKey: ['orders'] })
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

    mutation.mutate({
      clienteId: Number(clientId),
      notas,
      articulos,
    })
  }

  const total = menuItems
    ? Object.entries(items).reduce((sum, [id, qty]) => {
        const item = menuItems.find(m => m.id === Number(id))
        return sum + (item?.precio ?? 0) * qty
      }, 0)
    : 0

  if (isLoading) return <p className="text-gray-500">Cargando menú...</p>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">
        ← Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Nuevo pedido</h1>
      <p className="text-gray-500 mb-4">Cliente: {client?.nombre ?? `#${clientId}`}</p>

      <div className="grid gap-3 mb-4">
        {menuItems?.filter(m => m.disponible).map(item => (
          <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{item.nombre}</p>
              <p className="text-sm text-gray-500">${item.precio.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeQty(item.id, -1)}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-6 text-center font-medium">{items[item.id] ?? 0}</span>
              <button
                onClick={() => changeQty(item.id, 1)}
                className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={notas}
        onChange={e => setNotas(e.target.value)}
        placeholder="Notas del pedido (opcional)"
        className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 resize-none"
        rows={2}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
        <span className="font-bold text-lg">Total: ${total.toFixed(2)}</span>
        <button
          onClick={handleSubmit}
          disabled={Object.keys(items).length === 0 || mutation.isPending}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Enviando...' : 'Confirmar pedido'}
        </button>
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-sm mt-2">Error al crear el pedido. Intenta de nuevo.</p>
      )}
    </div>
  )
}
