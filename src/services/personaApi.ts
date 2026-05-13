import { apiClient } from '../lib/apiClient'
import type { ApiId, Persona, PersonaStatusResponse } from '../types/api'

export const personaApi = {
  getPersona(personaId: ApiId) {
    return apiClient.get<Persona>(`/personas/${personaId}`)
  },

  getPersonaStatus(personaId: ApiId) {
    return apiClient.get<PersonaStatusResponse>(`/personas/${personaId}/status`)
  },
}
