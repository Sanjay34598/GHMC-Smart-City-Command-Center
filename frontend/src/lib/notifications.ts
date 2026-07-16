import axios from 'axios'
import { API_BASE_URL } from '@/constants/site'

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

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await axios.get<Notification[]>(`${API_BASE_URL}/notifications`)
  return data
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await axios.patch<Notification>(`${API_BASE_URL}/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead(): Promise<void> {
  await axios.patch(`${API_BASE_URL}/notifications/read-all`)
}
