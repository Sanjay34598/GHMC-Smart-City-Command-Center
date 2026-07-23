import { api } from '@/lib/api'

export type IncidentFormPayload = {
  title: string
  description: string
  category: string
  severity: string
  latitude: number
  longitude: number
  image: File
}

export type IncidentResponse = {
  id: string
  title: string
  description: string
  category: string
  severity: string
  latitude: number
  longitude: number
  image_path: string
  status: string
  ward?: string
  department?: string
  created_at: string
  updated_at: string
}

export async function createIncident(
  payload: IncidentFormPayload,
  onProgress: (progress: number) => void,
): Promise<IncidentResponse> {
  const body = new FormData()
  Object.entries(payload).forEach(([key, value]) =>
    body.append(key, value instanceof File ? value : String(value)),
  )
  const { data } = await api.post<IncidentResponse>('/incidents', body, {
    onUploadProgress: (event) =>
      onProgress(event.total ? (event.loaded / event.total) * 100 : 0),
  })
  return data
}

export type ReportIncidentPayload = {
  title: string
  category: string
  description: string
  latitude: number
  longitude: number
  image?: File | null
}

export async function reportIncident(payload: ReportIncidentPayload): Promise<IncidentResponse> {
  const body = new FormData()
  body.append('title', payload.title)
  body.append('category', payload.category)
  body.append('description', payload.description)
  body.append('latitude', String(payload.latitude))
  body.append('longitude', String(payload.longitude))
  if (payload.image) {
    body.append('image', payload.image)
  }
  const { data } = await api.post<IncidentResponse>('/incidents/report', body)
  return data
}

export async function getIncident(id: string): Promise<IncidentResponse> {
  const { data } = await api.get<IncidentResponse>(`/incidents/${id}`)
  return data
}

export async function updateIncidentStatus(id: string, status: string): Promise<IncidentResponse> {
  const { data } = await api.patch<IncidentResponse>(`/incidents/${id}/status`, { status })
  return data
}

export type LLMAnalysisResponse = {
  id: string
  incident_id: string
  provider: string
  model: string
  summary: string
  risk_level: string
  recommendations: string[]
  services: string[]
  warning: string
  created_at: string
}

export async function summarizeIncident(id: string): Promise<LLMAnalysisResponse> {
  const { data } = await api.post<LLMAnalysisResponse>(`/incidents/${id}/summarize`)
  return data
}

export async function getIncidentSummary(id: string): Promise<LLMAnalysisResponse> {
  const { data } = await api.get<LLMAnalysisResponse>(`/incidents/${id}/summary`)
  return data
}


export type AgentStatusUpdate = {
  id: string
  incident_id: string
  agent_type: string
  status: 'thinking' | 'completed' | 'failed'
  payload: Record<string, unknown> | null
  created_at: string
}

export type CoordinationResponse = {
  incident_id: string
  agents: AgentStatusUpdate[]
}

export async function triggerCoordination(id: string): Promise<CoordinationResponse> {
  const { data } = await api.post<CoordinationResponse>(`/incidents/${id}/coordinate`)
  return data
}

export async function getCoordinationStatus(id: string): Promise<CoordinationResponse> {
  const { data } = await api.get<CoordinationResponse>(`/incidents/${id}/coordination`)
  return data
}

