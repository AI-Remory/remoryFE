import { apiClient } from './apiClient'
import type { PersonaDetailResponse, PersonaId, PersonaStatusResponse } from '../types/persona'

export const personaService = {
  createPersona(targetId: number) {
    return apiClient.post<PersonaDetailResponse>(`/targets/${targetId}/persona`)
  },

  getPersona(personaId: PersonaId) {
    return apiClient.get<PersonaDetailResponse>(`/personas/${personaId}`)
  },

  getPersonaStatus(personaId: PersonaId) {
    return apiClient.get<PersonaStatusResponse>(`/personas/${personaId}/status`)
  },
}
