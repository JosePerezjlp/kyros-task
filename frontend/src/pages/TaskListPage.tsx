import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import FilterBar from '../components/FilterBar'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import { useNotify } from '../context/NotificationContext'
import { getErrorMessage } from '../services/api'
import { getCategories, getPriorities } from '../services/lookup.service'
import * as taskService from '../services/task.service'
import type { MasterData, Task, TaskFilters, TaskInput } from '../types'

export default function TaskListPage() {
  const notify = useNotify()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilters>({})
  const [categories, setCategories] = useState<MasterData[]>([])
  const [priorities, setPriorities] = useState<MasterData[]>([])
  const [editing, setEditing] = useState<Task | null>(null)
  const [toDelete, setToDelete] = useState<Task | null>(null)

  // A half-filled date range is not sent until both dates are set
  const rangeComplete = Boolean(filters.start_date) === Boolean(filters.end_date)

  const loadTasks = useCallback(async () => {
    if (!rangeComplete) return
    setLoading(true)
    try {
      setTasks(await taskService.listTasks(filters))
    } catch (err) {
      notify('error', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filters, rangeComplete, notify])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    Promise.all([getCategories(), getPriorities()])
      .then(([c, p]) => {
        setCategories(c)
        setPriorities(p)
      })
      .catch((err) => notify('error', getErrorMessage(err)))
  }, [notify])

  async function handleSubmit(input: TaskInput): Promise<boolean> {
    try {
      if (editing) {
        await taskService.updateTask(editing.id, input)
        notify('success', 'Tarea actualizada')
        setEditing(null)
      } else {
        await taskService.createTask(input)
        notify('success', 'Tarea creada')
      }
      await loadTasks()
      return true
    } catch (err) {
      notify('error', getErrorMessage(err))
      return false
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    const task = toDelete
    setToDelete(null)
    try {
      await taskService.deleteTask(task.id)
      notify('success', 'Tarea eliminada')
      if (editing?.id === task.id) setEditing(null)
      await loadTasks()
    } catch (err) {
      notify('error', getErrorMessage(err))
    }
  }

  function startEdit(task: Task) {
    setEditing(task)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <TaskForm
          task={editing}
          categories={categories}
          priorities={priorities}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />
      </aside>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-slate-900">Mis tareas</h1>
          <span className="text-sm text-slate-500">{tasks.length} tarea(s)</span>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {loading ? (
          <p className="text-sm text-slate-500">Cargando tareas…</p>
        ) : tasks.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">No hay tareas que coincidan. ¡Crea la primera!</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={startEdit} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        message={`Se eliminará la tarea "${toDelete?.title}". Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
