import { apiClient } from './apiClient'
import type { ConsentCreate, ConsentResponse, ConsentRevokeResponse } from '../types/consent'

export const consentService = {
  listConsents() {
    return apiClient.get<ConsentResponse[]>('/consents')
  },

  listTargetConsents(targetId: number) {
    return apiClient.get<ConsentResponse[]>(`/targets/${targetId}/consents`)
  },

  createConsent(payload: ConsentCreate) {
    return apiClient.post<ConsentResponse>('/consents', payload)
  },

  revokeConsent(consentId: number) {
    return apiClient.patch<ConsentRevokeResponse>(`/consents/${consentId}/revoke`)
  },
}

