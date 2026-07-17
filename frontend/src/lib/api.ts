import axios from 'axios'

function normalizeApiBaseUrl(raw: string | undefined): string {
  const value = raw?.trim() ?? ''

  if (!value) return 'http://localhost:8000/api/v1'

  const normalized = value.replace(/\/+$/, '')
  if (normalized.endsWith('/api/v1')) return normalized
  if (normalized.endsWith('/api')) return `${normalized}/v1`
  if (normalized.includes('/api/v1')) return normalized
  return `${normalized}/api/v1`
}

function createWsBaseUrl(apiBaseUrl: string, raw?: string): string {
  const value = raw?.trim() ?? ''
  if (value) {
    const normalized = value.replace(/\/+$/, '')
    if (normalized.startsWith('ws://') || normalized.startsWith('wss://')) {
      return normalized.endsWith('/ws') ? normalized : `${normalized}/ws`
    }
  }

  const normalizedApiBaseUrl = apiBaseUrl.replace(/\/+$/, '')
  const protocol = normalizedApiBaseUrl.startsWith('https://') ? 'wss://' : 'ws://'
  return `${protocol}${normalizedApiBaseUrl.replace(/^https?:\/\//, '')}/ws`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL)
export const WS_BASE_URL = createWsBaseUrl(API_BASE_URL, import.meta.env.VITE_WS_URL)

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
})
