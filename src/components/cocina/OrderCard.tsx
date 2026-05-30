import type { Order } from '../../types'

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(isoDate))
}

export default function OrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-white leading-tight">{order.nombreCliente}</p>
          {order.referenciaCliente && (
            <p className="text-sm text-gray-400 mt-0.5">{order.referenciaCliente}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <span className="text-xs text-gray-500">#{order.id}</span>
          <p className="text-lg font-bold text-orange-400">{formatTime(order.fechaPedido)}</p>
        </div>
      </div>

      <ul className="space-y-1.5 border-t border-gray-700 pt-3">
        {order.articulos.map(item => (
          <li key={item.id} className="flex items-baseline gap-2">
            <span className="text-orange-300 font-bold text-lg leading-none w-6 text-right flex-shrink-0">
              {item.cantidad}×
            </span>
            <span className="text-white text-base leading-snug flex-1">{item.nombreArticulo}</span>
            <span className="text-gray-500 text-xs flex-shrink-0">{formatTime(order.fechaPedido)}</span>
          </li>
        ))}
      </ul>

      {order.notas && (
        <p className="text-sm text-yellow-300 bg-yellow-900/30 border border-yellow-700/40 rounded-lg px-3 py-2">
          {order.notas}
        </p>
      )}
    </div>
  )
}
