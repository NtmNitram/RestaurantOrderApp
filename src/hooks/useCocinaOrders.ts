import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api/orders'

const todayMX = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())

export function useCocinaOrders() {
  return useQuery({
    queryKey: ['cocina-orders', todayMX],
    queryFn: () => getOrders(todayMX),
    refetchInterval: 15_000,
    select: (orders) =>
      orders
        .filter(o => o.estado === 'Pendiente' && o.articulos.length > 0)
        .sort((a, b) => new Date(a.fechaPedido).getTime() - new Date(b.fechaPedido).getTime()),
  })
}
