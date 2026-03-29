import apiClient from './client'
import type { Client } from '../types'

export const getClients = async (): Promise<Client[]> => {
  const res = await apiClient.get<Client[]>('/clients')
  return res.data
}
