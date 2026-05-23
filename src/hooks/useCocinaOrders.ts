import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api/orders'

export function useCocinaOrders() {
  return useQuery({
    queryKey: ['cocina-orders'],
    queryFn: getOrders,
    refetchInterval: 15_000,
    select: (orders) =>
      orders
        .filter(o => o.estado === 'Pendiente')
        .sort((a, b) => new Date(a.fechaPedido).getTime() - new Date(b.fechaPedido).getTime()),
  })
}
