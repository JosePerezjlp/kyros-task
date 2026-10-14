import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNotify } from '../context/NotificationContext'
import { getErrorMessage } from '../services/api'
import * as maintenanceService from '../services/maintenance.service'
import type { MasterDataKind } from '../services/maintenance.service'
import type { MasterData } from '../types'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  kind: MasterDataKind
  title: string
  singular: string
}

/** List + create/edit/delete for one kind of master data (categories or priorities). */
export default function MasterDataSection({ kind, title, singular }: Props) {
  const notify = useNotify()
  const [items, setItems] = useState<MasterData[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [toDelete, setToDelete] = useState<MasterData | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await maintenanceService.listItems(kind))
    } catch (err) {
      notify('error', getErrorMessage(err))
    }
  }, [kind, notify])

  useEffect(() => {
    load()
  }, [load])

  async function run(action: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    try {
      await action()
      notify('success', successMessage)
      await load()
      return true
    } catch (err) {
      notify('error', getErrorMessage(err))
      return false
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (await run(() => maintenanceService.createItem(kind, newName.trim()), `${singular} creada`)) {
      setNewName('')
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    if (await run(() => maintenanceService.updateItem(kind, editingId, editName.trim()), `${singular} actualizada`)) {
      setEditingId(null)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    const item = toDelete
    setToDelete(null)
    await run(() => maintenanceService.deleteItem(kind, item.id), `${singular} eliminada`)
  }

  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          className="input"
          placeholder={`Nueva ${singular.toLowerCase()}`}
          value={newName}
          maxLength={100}
          required
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0">
          Agregar
        </button>
      </form>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="py-2">
            {editingId === item.id ? (
              <form onSubmit={handleUpdate} className="flex gap-2">
                <input
                  className="input"
                  value={editName}
                  maxLength={100}
                  required
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button type="submit" className="btn-primary shrink-0 px-3">
                  Guardar
                </button>
                <button type="button" className="btn-secondary shrink-0 px-3" onClick={() => setEditingId(null)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-800">{item.name}</span>
                <div className="flex gap-1">
                  <button
                    className="btn px-3 py-1 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditName(item.name)
                    }}
                  >
                    Editar
                  </button>
                  <button className="btn px-3 py-1 text-red-600 hover:bg-red-50" onClick={() => setToDelete(item)}>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-sm text-slate-500">No hay registros.</li>}
      </ul>

      <ConfirmDialog
        open={toDelete !== null}
        message={`Se eliminará "${toDelete?.name}". Si está asignada a alguna tarea, no se podrá eliminar.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}
