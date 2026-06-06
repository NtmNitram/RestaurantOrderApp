import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import type { Order } from '../../types'
import { changeOrderStatus } from '../../api/orders'

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoDate))
}

export default function OrderCard({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const mutation = useMutation({
    mutationFn: () => changeOrderStatus(order.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina-orders'] })
    },
  })

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-white leading-tight">{order.nombreCliente}</p>
          {order.referenciaCliente && (
            <p className="text-sm text-gray-400 mt-0.5">{order.referenciaCliente}</p>
          )}
        </div>
        <div className="flex items-start gap-2 flex-shrink-0 ml-3">
          <div className="text-right">
            <span className="text-xs text-gray-500">#{order.id}</span>
            <p className="text-lg font-bold text-orange-400">{formatTime(order.fechaPedido)}</p>
          </div>
          <button
            onClick={() => { setConfirming(true); mutation.reset() }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 text-gray-400 hover:bg-red-900/60 hover:text-red-400 transition-colors mt-0.5"
            title="Marcar como listo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ul className="space-y-2 border-t border-gray-700 pt-3">
        {order.articulos.map(item => (
          <li key={item.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-orange-300 font-bold text-lg leading-none w-6 text-right flex-shrink-0">
                {item.cantidad}×
              </span>
              <span className="text-white text-base leading-snug flex-1">{item.nombreArticulo}</span>
              <span className="text-gray-500 text-xs flex-shrink-0">{formatTime(item.createdAt)}</span>
            </div>
            {item.notas && (
              <p className="text-sm text-yellow-200 italic ml-8 mt-0.5">{item.notas}</p>
            )}
          </li>
        ))}
      </ul>

      {order.notas && (
        <p className="text-sm text-yellow-300 bg-yellow-900/30 border border-yellow-700/40 rounded-lg px-3 py-2">
          {order.notas}
        </p>
      )}

      {confirming && (
        <div className="border-t border-gray-700 pt-3">
          <p className="text-sm text-white font-medium mb-3">¿Marcar como listo?</p>
          {mutation.isError && (
            <p className="text-xs text-red-400 mb-2">Error al actualizar. Intenta de nuevo.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => { setConfirming(false); mutation.reset() }}
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
