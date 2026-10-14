import { api } from './api'
import type { MasterData } from '../types'

export async function getCategories(): Promise<MasterData[]> {
  const { data } = await api.get<MasterData[]>('/categories')
  return data
}

export async function getPriorities(): Promise<MasterData[]> {
  const { data } = await api.get<MasterData[]>('/priorities')
  return data
}
