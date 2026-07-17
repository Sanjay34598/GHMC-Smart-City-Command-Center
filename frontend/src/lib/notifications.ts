import { api } from '@/lib/api'

export type Notification = {
  id: string
  incident_id: string
  title: string
  message: string
  severity: string
  type: string
  is_read: boolean
  created_at: string
}

function normalizeNotificationsPayload(data: unknown): Notification[] {
  if (Array.isArray(data)) return data as Notification[]

  if (data && typeof data === 'object') {
    const payload = data as { items?: unknown }
    if (Array.isArray(payload.items)) return payload.items as Notification[]
  }

  return []
}

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<unknown>('/notifications')
  return normalizeNotificationsPayload(data)
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<unknown>(`/notifications/${id}/read`)
  return (data as Notification)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
