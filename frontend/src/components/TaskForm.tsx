import { useEffect, useState, type FormEvent } from 'react'
import { STATUS_LABELS, TASK_STATUSES, type MasterData, type Task, type TaskInput, type TaskStatus } from '../types'
import { toDateInput } from '../utils/date'

interface Props {
  task: Task | null
  categories: MasterData[]
  priorities: MasterData[]
  onSubmit: (input: TaskInput) => Promise<boolean>
  onCancelEdit: () => void
}

const EMPTY = { title: '', description: '', dueDate: '', categoryId: '', priorityId: '', status: 'pending' as TaskStatus }

export default function TaskForm({ task, categories, priorities, onSubmit, onCancelEdit }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = task !== null

  // Pre-fill when switching to edit mode, reset when going back to create mode
  useEffect(() => {
    setForm(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            dueDate: toDateInput(task.dueDate),
            categoryId: task.categoryId ?? '',
            priorityId: task.priorityId ?? '',
            status: task.status,
          }
        : EMPTY,
    )
  }, [task])

  function update<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const ok = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      dueDate: form.dueDate || null,
      categoryId: form.categoryId || null,
      priorityId: form.priorityId || null,
      ...(isEdit ? { status: form.status } : {}),
    })
    setSubmitting(false)
    if (ok && !isEdit) setForm(EMPTY)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-base font-semibold text-slate-900">{isEdit ? 'Editar tarea' : 'Nueva tarea'}</h2>

      <div>
        <label className="label" htmlFor="title">
          Título *
        </label>
        <input
          id="title"
          className="input"
          value={form.title}
          maxLength={120}
          required
          onChange={(e) => update('title', e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          className="input min-h-[80px]"
          value={form.description}
          maxLength={500}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="dueDate">
            Fecha límite
          </label>
          <input
            id="dueDate"
            type="date"
            className="input"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
          />
        </div>

        {isEdit && (
          <div>
            <label className="label" htmlFor="status">
              Estado
            </label>
            <select
              id="status"
              className="input"
              value={form.status}
              onChange={(e) => update('status', e.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="categoryId">
            Categoría
          </label>
          <select
            id="categoryId"
            className="input"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="priorityId">
            Prioridad
          </label>
          <select
            id="priorityId"
            className="input"
            value={form.priorityId}
            onChange={(e) => update('priorityId', e.target.value)}
          >
            <option value="">Sin prioridad</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
        </button>
        {isEdit && (
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
