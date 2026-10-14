import { api } from './api'
import type { Report } from '../types'

export async function getReport(): Promise<Report> {
  const { data } = await api.get<Report>('/reports', { timeout: 10_000 })
  return data
}
