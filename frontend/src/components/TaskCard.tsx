import type { Task } from '../types'
import { formatDate, todayInput, toDateInput } from '../utils/date'
import StatusBadge from './StatusBadge'

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskCard({ task, onEdit, onDelete }: Props) {
  const isOverdue = task.dueDate !== null && task.status !== 'done' && toDateInput(task.dueDate) < todayInput()

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className={`font-semibold text-slate-900 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </h3>
        <StatusBadge status={task.status} />
      </div>

      {task.description && <p className="whitespace-pre-line text-sm text-slate-600">{task.description}</p>}

      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`rounded px-2 py-1 ${isOverdue ? 'bg-red-100 font-semibold text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          📅 {formatDate(task.dueDate)}
          {isOverdue && ' · Vencida'}
        </span>
        {task.category && <span className="rounded bg-violet-100 px-2 py-1 text-violet-700">{task.category.name}</span>}
        {task.priority && <span className="rounded bg-orange-100 px-2 py-1 text-orange-700">Prioridad: {task.priority.name}</span>}
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button className="btn-secondary px-3 py-1.5" onClick={() => onEdit(task)}>
          Editar
        </button>
        <button className="btn px-3 py-1.5 text-red-600 hover:bg-red-50" onClick={() => onDelete(task)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}
