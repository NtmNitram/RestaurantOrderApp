import apiClient from './client'
import type { MenuItem } from '../types'

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const res = await apiClient.get<MenuItem[]>('/menuitems')
  return res.data
}
