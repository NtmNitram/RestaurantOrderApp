import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingTableware, recoverTableware } from '../api/tableware'
import type { Tableware } from '../types'
import { Archive, CheckCircle, Minus, Plus } from 'lucide-react'

function TablewareCard({ item }: { item: Tableware }) {
  const queryClient = useQueryClient()
  const [cantidad, setCantidad] = useState(item.pendiente)
  const [recuperando, setRecuperando] = useState(false)

  const mutation = useMutation({
    mutationFn: () => recoverTableware(item.orderId, { quantityRecovered: cantidad }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableware-pending'] })
      setRecuperando(false)
    },
  })

  const cambiarCantidad = (delta: number) =>
    setCantidad(prev => Math.min(item.pendiente, Math.max(1, prev + delta)))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-800">{item.nombreCliente}</p>
          {item.referencia && (
            <p className="text-xs text-gray-500 mt-0.5">{item.referencia}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">Pedido #{item.orderId}</p>
        </div>
        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800">
          <Archive className="w-3.5 h-3.5" />
          {item.pendiente} pendiente{item.pendiente !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-4 text-sm text-gray-600 mb-3 border-t border-gray-100 pt-3">
        <span>Entregados: <strong>{item.quantityDelivered}</strong></span>
        <span>Recuperados: <strong>{item.quantityRecovered ?? 0}</strong></span>
        <span className="text-amber-700 font-medium">Pendiente: <strong>{item.pendiente}</strong></span>
      </div>

      {recuperando ? (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-2">¿Cuántos platos recuperas?</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarCantidad(-1)}
                disabled={cantidad <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-gray-800">{cantidad}</span>
              <button
                onClick={() => cambiarCantidad(1)}
                disabled={cantidad >= item.pendiente}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setRecuperando(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
          {mutation.isError && (
            <p className="text-xs text-red-600 mt-2">Error al guardar. Intenta de nuevo.</p>
          )}
        </div>
      ) : (
        <div className="border-t border-gray-100 pt-3 flex justify-end">
          <button
            onClick={() => { setCantidad(item.pendiente); setRecuperando(true) }}
            className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Recuperar
          </button>
        </div>
      )}
    </div>
  )
}

export default function VajillaPage() {
  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['tableware-pending'],
    queryFn: getPendingTableware,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      Cargando vajilla...
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Error al cargar la vajilla.
    </div>
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Control de vajilla</h1>
        <p className="text-sm text-gray-500 mt-1">Platos entregados a clientes externos pendientes de recuperar</p>
      </div>

      {items?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="text-lg font-medium">Todo recuperado</p>
          <p className="text-sm mt-1">No hay vajilla pendiente de recuperar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items?.map((item: Tableware) => (
            <TablewareCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
