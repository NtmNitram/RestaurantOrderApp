import apiClient from './client'
import type { User, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../types'

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get<User[]>('/users')
  return res.data
}

export const createUser = async (dto: CreateUserRequest): Promise<User> => {
  const res = await apiClient.post<User>('/users', dto)
  return res.data
}

export const updateUser = async (id: number, dto: UpdateUserRequest): Promise<User> => {
  const res = await apiClient.put<User>(`/users/${id}`, dto)
  return res.data
}

export const setUserActive = async (id: number, active: boolean): Promise<User> => {
  const res = await apiClient.patch<User>(`/users/${id}/active`, { active })
  return res.data
}

export const resetUserPassword = async (id: number, dto: ResetPasswordRequest): Promise<void> => {
  await apiClient.post(`/users/${id}/reset-password`, dto)
}
