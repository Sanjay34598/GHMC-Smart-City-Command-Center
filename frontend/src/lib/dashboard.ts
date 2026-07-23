import { api } from '@/lib/api'

export type DashboardStats = {
  total: number
  active: number
  critical: number
  resolved: number
  pending_verification?: number
  latest_incident?: {
    id: string
    title: string
    category: string
    severity: string
    status: string
    created_at: string
  } | null
  avg_response_time: number | null
  severity_distribution: { severity: string; count: number }[]
  category_distribution: { category: string; count: number }[]
  daily_trend: { date: string; count: number }[]
  ward_distribution: { ward: string; count: number }[]
  department_distribution: { department: string; count: number }[]
}

export type DashboardIncident = {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  latitude: number
  longitude: number
  image_path: string
  is_civic_issue: boolean
  ward: string | null
  department: string | null
  estimated_resolution: string | null
  created_at: string
  updated_at: string
}

export type DashboardIncidentList = {
  total: number
  items: DashboardIncident[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

export type DashboardFilters = {
  severity?: string
  category?: string
  status?: string
  search?: string
  is_civic_issue?: boolean
  days?: number
  limit?: number
  offset?: number
}

export async function getDashboardIncidents(
  filters: DashboardFilters = {},
): Promise<DashboardIncidentList> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  )
  const { data } = await api.get<DashboardIncidentList>('/dashboard/incidents', { params })
  return data
}
