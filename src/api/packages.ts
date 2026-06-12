import apiClient from './client'
import type { PackageDto, DailyOptionDto, DailyAvailabilityUpdateItem } from '../types'

export const getPackages = (): Promise<PackageDto[]> =>
  apiClient.get('/packages').then(r => r.data)

export const getDailyAvailability = (): Promise<DailyOptionDto[]> =>
  apiClient.get('/packages/options/availability').then(r => r.data)

export const updateDailyAvailability = (
  updates: DailyAvailabilityUpdateItem[]
): Promise<{ updated: number }> =>
  apiClient.put('/packages/options/availability', { actualizaciones: updates }).then(r => r.data)
