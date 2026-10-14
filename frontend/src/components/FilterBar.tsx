import { STATUS_LABELS, TASK_STATUSES, type TaskFilters, type TaskStatus } from '../types'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  // The API requires both dates together; show a hint while only one is set
  const incompleteRange = Boolean(filters.start_date) !== Boolean(filters.end_date)
  const hasFilters = Boolean(filters.status || filters.start_date || filters.end_date)

  return (
    <div className="card grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
      <div>
        <label className="label" htmlFor="filter-status">
          Estado
        </label>
        <select
          id="filter-status"
          className="input"
          value={filters.status ?? ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value as TaskStatus | '' })}
        >
          <option value="">Todos</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="filter-start">
          Fecha límite desde
        </label>
        <input
          id="filter-start"
          type="date"
          className="input"
          value={filters.start_date ?? ''}
          max={filters.end_date || undefined}
          onChange={(e) => onChange({ ...filters, start_date: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="filter-end">
          Fecha límite hasta
        </label>
        <input
          id="filter-end"
          type="date"
          className="input"
          value={filters.end_date ?? ''}
          min={filters.start_date || undefined}
          onChange={(e) => onChange({ ...filters, end_date: e.target.value })}
        />
      </div>
      <button className="btn-secondary" disabled={!hasFilters} onClick={() => onChange({})}>
        Limpiar filtros
      </button>
      {incompleteRange && (
        <p className="text-xs text-amber-700 sm:col-span-4">Selecciona ambas fechas para filtrar por rango.</p>
      )}
    </div>
  )
}
