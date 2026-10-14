import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import Notification from '../components/Notification'

export type NotificationType = 'success' | 'error'

export interface NotificationItem {
  id: number
  type: NotificationType
  message: string
}

interface NotificationContextValue {
  notify: (type: NotificationType, message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const AUTO_DISMISS_MS = 4000
let nextId = 1

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      const id = nextId++
      setItems((current) => [...current, { id, type, message }])
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <Notification key={item.id} item={item} onClose={() => dismiss(item.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotify(): NotificationContextValue['notify'] {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used inside NotificationProvider')
  return ctx.notify
}
