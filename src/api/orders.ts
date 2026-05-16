import apiClient from './client'
import type { Order, CreateOrderDto, DailySummary } from '../types'

export const getOrders = async (): Promise<Order[]> => {
  const res = await apiClient.get<Order[]>('/Orders')
  return res.data
}

export const createOrder = async (dto: CreateOrderDto): Promise<Order> => {
  const res = await apiClient.post<Order>('/Orders', dto)
  return res.data
}

export const changeOrderStatus = async (id: number, estado: number): Promise<void> => {
  await apiClient.patch(`/Orders/${id}/status`, { estado })
}

export const changePaymentStatus = async (id: number, estadoCobro: number): Promise<void> => {
  await apiClient.patch(`/Orders/${id}/payment-status`, { estadoCobro })
}

export const addItemsToOrder = async (
  id: number,
  articulos: { articuloId: number; cantidad: number }[]
): Promise<void> => {
  await apiClient.post(`/Orders/${id}/items`, { articulos })
}

export const getDailySummary = async (params?: { startDate?: string; endDate?: string }): Promise<DailySummary> => {
  const res = await apiClient.get<DailySummary>('/Orders/summary/daily', { params })
  return res.data
}
