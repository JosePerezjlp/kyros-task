import MasterDataSection from '../components/MasterDataSection'

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mantenimiento</h1>
        <p className="text-sm text-slate-500">Gestiona los datos maestros disponibles para todas las tareas.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MasterDataSection kind="categories" title="Categorías" singular="Categoría" />
        <MasterDataSection kind="priorities" title="Prioridades" singular="Prioridad" />
      </div>
    </div>
  )
}
