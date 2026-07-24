/**
 * Frontend service layer for AI analysis operations.
 *
 * All API calls are centralised here. Pages and components import typed
 * functions — never the raw axios instance — so auth headers, retries, and
 * error normalisation can be added in one place later.
 */
import { api, API_BASE_URL } from '@/lib/api'

export type Detection = {
  label: string
  confidence: number
  /** Bounding box as [x1, y1, x2, y2] in original image pixel coordinates. */
  bbox: [number, number, number, number]
}

export type PredictionJson = {
  detections: Detection[]
  model_name: string
  model_version: string
  inference_ms: number
  /** Original image width used to scale bounding boxes on the frontend. */
  image_width: number
  /** Original image height used to scale bounding boxes on the frontend. */
  image_height: number
  severity: string | null
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type AnalysisResult = {
  id: string
  incident_id: string
  model_name: string
  model_version: string
  status: AnalysisStatus
  prediction_json: PredictionJson | null
  processing_time: number | null
  created_at: string
}

/**
 * Trigger the AI analysis pipeline for an incident.
 * Called only when no prior analysis exists (checked first via getAnalysis).
 */
export async function analyzeIncident(incidentId: string): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>(`/incidents/${incidentId}/analyze`)
  return data
}

/**
 * Retrieve the latest stored analysis without re-running inference.
 * Returns null when no analysis exists yet (404 from the API).
 */
export async function getAnalysis(incidentId: string): Promise<AnalysisResult | null> {
  try {
    const { data } = await api.get<AnalysisResult>(`/incidents/${incidentId}/analysis`)
    return data
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 404) return null
    }
    throw err
  }
}

/**
 * Compute the full URL for a stored incident image.
 * Derives the backend origin from API_BASE_URL so both values stay in sync.
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath || !imagePath.trim()) return ''
  const trimmed = imagePath.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  const cleanPath = trimmed.replace(/^\/+/, '')
  return `${origin}/${cleanPath}`
}
