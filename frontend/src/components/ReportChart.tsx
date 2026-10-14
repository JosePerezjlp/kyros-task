import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '../types'

const COLORS: Record<TaskStatus, string> = {
  pending: '#f59e0b',
  in_progress: '#0ea5e9',
  done: '#10b981',
}

export default function ReportChart({ byStatus }: { byStatus: Record<TaskStatus, number> }) {
  const data = TASK_STATUSES.map((status) => ({ status, name: STATUS_LABELS[status], value: byStatus[status] }))

  return (
    <div className="card">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Tareas por estado</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [value, 'Tareas']} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
