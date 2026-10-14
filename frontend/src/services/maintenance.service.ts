import { api } from './api'
import type { MasterData } from '../types'

export type MasterDataKind = 'categories' | 'priorities'

export async function listItems(kind: MasterDataKind): Promise<MasterData[]> {
  const { data } = await api.get<MasterData[]>(`/admin/${kind}`)
  return data
}

export async function createItem(kind: MasterDataKind, name: string): Promise<MasterData> {
  const { data } = await api.post<MasterData>(`/admin/${kind}`, { name })
  return data
}

export async function updateItem(kind: MasterDataKind, id: string, name: string): Promise<MasterData> {
  const { data } = await api.patch<MasterData>(`/admin/${kind}/${id}`, { name })
  return data
}

export async function deleteItem(kind: MasterDataKind, id: string): Promise<void> {
  await api.delete(`/admin/${kind}/${id}`)
}
