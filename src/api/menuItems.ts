import apiClient from './client'
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '../types'

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const res = await apiClient.get<MenuItem[]>('/menuitems')
  return res.data
}

export const createMenuItem = async (dto: CreateMenuItemDto): Promise<MenuItem> => {
  const res = await apiClient.post<MenuItem>('/menuitems', dto)
  return res.data
}

export const updateMenuItem = async (id: number, dto: UpdateMenuItemDto): Promise<MenuItem> => {
  const res = await apiClient.put<MenuItem>(`/menuitems/${id}`, dto)
  return res.data
}

export const deleteMenuItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/menuitems/${id}`)
}
