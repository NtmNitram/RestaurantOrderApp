import axios from 'axios'
import type { Order } from '../types'

// Plain client — no auth interceptor, no token. The /Orders endpoint is [AllowAnonymous].
const cocinaClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const getCocinaOrders = async (): Promise<Order[]> => {
  const res = await cocinaClient.get<Order[]>('/Orders')
  return res.data
    .filter(o => o.estado === 'Pendiente')
    .sort((a, b) => new Date(a.fechaPedido).getTime() - new Date(b.fechaPedido).getTime())
}
