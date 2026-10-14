import type { Report } from '../types'
import { formatDate } from '../utils/date'

export default function UpcomingTaskList({ tasks }: { tasks: Report['upcoming']['tasks'] }) {
  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold text-slate-900">Próximas a vencer (7 días)</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No hay tareas próximas a vencer.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-slate-800">{t.title}</span>
              <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {formatDate(t.dueDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
