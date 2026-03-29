import apiClient from './client'
import type { Order, CreateOrderDto, DailySummaryItem } from '../types'

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

export const getDailySummary = async (): Promise<DailySummaryItem[]> => {
  const res = await apiClient.get<DailySummaryItem[]>('/Orders/summary/daily')
  return res.data
}
