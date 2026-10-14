import { useCallback, useEffect, useState } from 'react'
import ReportCard from '../components/ReportCard'
import ReportChart from '../components/ReportChart'
import UpcomingTaskList from '../components/UpcomingTaskList'
import { getErrorMessage } from '../services/api'
import { getReport } from '../services/report.service'
import type { Report } from '../types'

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReport(await getReport())
    } catch (err) {
      // Never show partial data when the report fails
      setReport(null)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const total = report ? report.byStatus.pending + report.byStatus.in_progress + report.byStatus.done : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Reporte de tareas</h1>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          Actualizar
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando reporte…</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudo cargar el reporte: {error}
        </div>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ReportCard label="Total de tareas" value={total} />
            <ReportCard label="Vencidas" value={report.overdueCount} tone="danger" />
            <ReportCard label="Próximas a vencer" value={report.upcoming.count} tone="warning" />
            <ReportCard label="Completadas" value={report.byStatus.done} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportChart byStatus={report.byStatus} />
            <UpcomingTaskList tasks={report.upcoming.tasks} />
          </div>
        </>
      )}
    </div>
  )
}
