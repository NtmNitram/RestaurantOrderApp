import apiClient from './client'
import type { Client, CreateClientDto } from '../types'

export const getClients = async (): Promise<Client[]> => {
  const res = await apiClient.get<Client[]>('/clients')
  return res.data
}

export const createClient = async (dto: CreateClientDto): Promise<Client> => {
  const res = await apiClient.post<Client>('/clients', dto)
  return res.data
}
