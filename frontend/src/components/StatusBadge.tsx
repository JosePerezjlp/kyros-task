import { STATUS_LABELS, type TaskStatus } from '../types'

const STYLES: Record<TaskStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-sky-100 text-sky-800',
  done: 'bg-emerald-100 text-emerald-800',
}

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>{STATUS_LABELS[status]}</span>
  )
}
