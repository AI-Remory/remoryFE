import { getAccessToken } from '../lib/apiClient'
import type { ApiId } from '../types/api'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL

export type RealtimeVoiceMessage = {
  type: string
  session_id?: ApiId
  text?: string
  audio_url?: string
  audio_file_path?: string
  message?: string
}

export function buildRealtimeVoiceUrl(personaId: ApiId) {
  const normalizedWsBaseUrl = WS_BASE_URL?.trim().replace(/\/+$/, '')

  if (!normalizedWsBaseUrl) {
    return null
  }

  const token = getAccessToken()
  const encodedPersonaId = encodeURIComponent(String(personaId))
  const params = new URLSearchParams()

  if (token) {
    params.set('token', token)
  }

  const queryString = params.toString()

  return `${normalizedWsBaseUrl}/ws/personas/${encodedPersonaId}/voice${queryString ? `?${queryString}` : ''}`
}
