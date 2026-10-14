import { api } from './api'
import type { Task, TaskFilters, TaskInput } from '../types'

export async function listTasks(filters: TaskFilters): Promise<Task[]> {
  // Only send filters that have a value
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  const { data } = await api.get<Task[]>('/tasks', { params })
  return data
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', input)
  return data
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, input)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}
