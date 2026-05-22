import apiClient from './client'
import type { Tableware, RegisterTablewareDto, RecoverTablewareDto } from '../types'

export const getPendingTableware = async (): Promise<Tableware[]> => {
  const res = await apiClient.get<Tableware[]>('/Tableware/pending')
  return res.data
}

export const registerTableware = async (dto: RegisterTablewareDto): Promise<Tableware> => {
  const res = await apiClient.post<Tableware>('/Tableware', dto)
  return res.data
}

export const recoverTableware = async (
  orderId: number,
  dto: RecoverTablewareDto
): Promise<Tableware> => {
  const res = await apiClient.patch<Tableware>(`/Tableware/order/${orderId}/recover`, dto)
  return res.data
}
