import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MapFilters = {
  severity?: string
  category?: string
  status?: string
  days?: number
}

export type MapIncident = {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  ward?: string | null
  latitude: number
  longitude: number
  image_path: string
  created_at: string
  updated_at: string
  ai_summary: string | null
  ai_risk_level: string | null
  ai_warning: string | null
}

export type EmergencyService = {
  id: string
  name: string
  category: 'hospital' | 'fire_station' | 'police' | 'shelter' | 'other'
  latitude: number
  longitude: number
  distance_km: number
  address: string | null
  phone: string | null
}

export type EmergencyServiceResult = {
  centre: { lat: number; lon: number }
  radius_m: number
  total: number
  items: EmergencyService[]
}

// ─── API functions ────────────────────────────────────────────────────────────

function normalizeMapPayload(data: unknown): { total: number; items: MapIncident[] } {
  if (Array.isArray(data)) {
    return { total: data.length, items: data as MapIncident[] }
  }

  if (data && typeof data === 'object') {
    const payload = data as { total?: number; items?: unknown }
    if (Array.isArray(payload.items)) {
      return {
        total: typeof payload.total === 'number' ? payload.total : payload.items.length,
        items: payload.items as MapIncident[],
      }
    }
  }

  return { total: 0, items: [] }
}

export async function getMapIncidents(filters: MapFilters = {}): Promise<{
  total: number
  items: MapIncident[]
}> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  )
  const { data } = await api.get<unknown>('/map/incidents', { params })
  return normalizeMapPayload(data)
}

export async function getEmergencyServices(
  lat: number,
  lon: number,
  radius = 5000,
  category?: string,
): Promise<EmergencyServiceResult> {
  const params: Record<string, string | number> = { lat, lon, radius }
  if (category) params.category = category
  const { data } = await api.get('/map/emergency-services', { params })
  return data
}
