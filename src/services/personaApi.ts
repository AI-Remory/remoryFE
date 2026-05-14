import { apiClient } from '../lib/apiClient'
import type { ApiId, Persona, PersonaStatusResponse, VoiceProfile } from '../types/api'

export const personaApi = {
  getPersona(personaId: ApiId) {
    return apiClient.get<Persona>(`/personas/${personaId}`)
  },

  getPersonaStatus(personaId: ApiId) {
    return apiClient.get<PersonaStatusResponse>(`/personas/${personaId}/status`)
  },

  createVoiceProfile(personaId: ApiId) {
    return apiClient.post<VoiceProfile>(`/personas/${personaId}/voice-profile`)
  },

  getVoiceProfile(personaId: ApiId) {
    return apiClient.get<VoiceProfile>(`/personas/${personaId}/voice-profile`)
  },

  evaluateVoiceProfile(personaId: ApiId) {
    return apiClient.post<VoiceProfile>(`/personas/${personaId}/voice-profile/evaluate`)
  },

  confirmVoiceProfile(personaId: ApiId, review_note?: string) {
    return apiClient.patch<VoiceProfile>(`/personas/${personaId}/voice-profile/user-confirm`, {
      review_note: review_note?.trim() || null,
    })
  },
}
