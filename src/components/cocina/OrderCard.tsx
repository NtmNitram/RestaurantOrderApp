import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import type { Order, OrderDetail } from '../../types'
import { changeOrderStatus } from '../../api/orders'
import { useAuth } from '../../context/AuthContext'

const NEW_ITEM_THRESHOLD_MS = 2 * 60 * 1000

function getNewItemIds(articulos: OrderDetail[]): Set<number> {
  const timestamps = articulos.map(item => new Date(item.createdAt).getTime())
  const minCreatedAt = Math.min(...timestamps)
  const newIds = new Set<number>()
  articulos.forEach((item, i) => {
    if (timestamps[i] - minCreatedAt > NEW_ITEM_THRESHOLD_MS) {
      newIds.add(item.id)
    }
  })
  return newIds
}

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoDate))
}

function buildKitchenLabel(item: OrderDetail): string {
  if (!item.selections || item.selections.length === 0) return item.nombreArticulo
  const opciones = item.selections.map(s => s.quantity > 1 ? `${s.quantity}x ${s.optionNameSnapshot}` : s.optionNameSnapshot).join(', ')
  return `${item.nombreArticulo} — ${opciones}`
}

interface Props {
  order: Order
  isLatest?: boolean
}

export default function OrderCard({ order, isLatest }: Props) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const { featureFlags } = useAuth()
  const newItemIds = getNewItemIds(order.articulos)

  const mutation = useMutation({
    mutationFn: () => changeOrderStatus(order.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina-orders'] })
    },
  })

  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${
      isLatest ? 'bg-yellow-900/10 border-yellow-500/60' : 'bg-gray-800 border-gray-700'
    }`}>
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
        {order.articulos.map(item => {
          const isNewItem = newItemIds.has(item.id)
          return (
            <li key={item.id}>
              <div className={`flex items-baseline gap-2 rounded-lg px-2 py-1 -mx-2 ${
                isNewItem ? 'bg-yellow-900/30 border-l-2 border-yellow-500' : ''
              }`}>
                <span className="text-orange-300 font-bold text-lg leading-none w-6 text-right flex-shrink-0">
                  {item.cantidad}×
                </span>
                <span className={`text-base leading-snug flex-1 ${isNewItem ? 'text-yellow-200' : 'text-white'}`}>
                  {featureFlags.packageOptions ? buildKitchenLabel(item) : item.nombreArticulo}
                  {featureFlags.packageOptions && item.isToGo && (
                    <span className="ml-2 text-yellow-300 text-xs">🥡 Para llevar</span>
                  )}
                </span>
                <span className="text-gray-500 text-xs flex-shrink-0">{formatTime(item.createdAt)}</span>
              </div>
              {item.notas && (
                <p className="text-sm text-yellow-200 italic ml-8 mt-0.5">{item.notas}</p>
              )}
            </li>
          )
        })}
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
