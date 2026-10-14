export type Role = 'USER' | 'ADMIN'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  done: 'Completada',
}

export const TASK_STATUSES = Object.keys(STATUS_LABELS) as TaskStatus[]

export interface User {
  id: string
  email: string
  role: Role
}

export interface AuthResponse {
  token: string
  user: User
}

export interface MasterData {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  categoryId: string | null
  priorityId: string | null
  category: MasterData | null
  priority: MasterData | null
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description: string | null
  dueDate: string | null
  categoryId: string | null
  priorityId: string | null
  status?: TaskStatus
}

export interface TaskFilters {
  status?: TaskStatus | ''
  start_date?: string
  end_date?: string
}

export interface Report {
  byStatus: Record<TaskStatus, number>
  overdueCount: number
  upcoming: {
    count: number
    tasks: Array<{ id: string; title: string; dueDate: string }>
  }
}
