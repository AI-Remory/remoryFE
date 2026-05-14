import { API_BASE_URL, getAccessToken } from '../lib/apiClient'
import type { ApiId } from '../types/api'

export type RealtimeVoiceMessage = {
  type: string
  session_id?: ApiId
  text?: string
  audio_url?: string
  audio_file_path?: string
  message?: string
}

export function buildRealtimeVoiceUrl(personaId: ApiId) {
  const token = getAccessToken()
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const encodedPersonaId = encodeURIComponent(String(personaId))
  const params = new URLSearchParams()

  if (token) {
    params.set('token', token)
  }

  return `${protocol}//${window.location.host}${API_BASE_URL}/ws/personas/${encodedPersonaId}/voice?${params}`
}
