import { useQuery } from '@tanstack/react-query'
import { getCocinaOrders } from '../api/cocina'

export function useCocinaOrders() {
  return useQuery({
    queryKey: ['cocina-orders'],
    queryFn: getCocinaOrders,
    refetchInterval: 15_000,
  })
}
