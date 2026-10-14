import type { NotificationItem } from '../context/NotificationContext'

interface Props {
  item: NotificationItem
  onClose: () => void
}

export default function Notification({ item, onClose }: Props) {
  const styles =
    item.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-800'

  return (
    <div role="status" className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-md ${styles}`}>
      <span className="flex-1">{item.message}</span>
      <button onClick={onClose} className="font-semibold opacity-60 hover:opacity-100" aria-label="Cerrar notificación">
        ✕
      </button>
    </div>
  )
}
