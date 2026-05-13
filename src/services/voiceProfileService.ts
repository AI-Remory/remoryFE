import { apiClient } from './apiClient'
import type { PersonaVoiceProfileResponse, VoiceProfileReviewRequest } from '../types/voiceProfile'

export const voiceProfileService = {
  getVoiceProfile(personaId: number) {
    return apiClient.get<PersonaVoiceProfileResponse>(`/personas/${personaId}/voice-profile`)
  },

  createVoiceProfile(personaId: number) {
    return apiClient.post<PersonaVoiceProfileResponse>(`/personas/${personaId}/voice-profile`)
  },

  evaluateVoiceProfile(personaId: number) {
    return apiClient.post<PersonaVoiceProfileResponse>(`/personas/${personaId}/voice-profile/evaluate`)
  },

  confirmVoiceProfile(personaId: number, payload: VoiceProfileReviewRequest) {
    return apiClient.patch<PersonaVoiceProfileResponse>(`/personas/${personaId}/voice-profile/user-confirm`, payload)
  },
}

