import { apiClient } from '../lib/apiClient'
import type { ApiId, Consent, ConsentType } from '../types/api'

export const CONSENT_TYPES = {
  targetProfile: 'target_profile_consent',
  photoUpload: 'photo_upload_consent',
  voiceUpload: 'voice_upload_consent',
  voiceCloning: 'voice_cloning_consent',
  aiPersonaCreation: 'ai_persona_creation_consent',
  aiResponseNotice: 'ai_response_notice_consent',
  storybookShare: 'storybook_share_consent',
  groupShare: 'group_share_consent',
  dataRetention: 'data_retention_consent',
  thirdPartyAiProcessing: 'third_party_ai_processing_consent',
} as const satisfies Record<string, ConsentType>

type CreateConsentPayload = {
  target_id?: ApiId
  consent_type: ConsentType
  is_consented?: boolean
}

export const consentApi = {
  createConsent(payload: CreateConsentPayload) {
    return apiClient.post<Consent>('/consents', {
      is_consented: true,
      ...payload,
    })
  },

  listConsents() {
    return apiClient.get<Consent[]>('/consents')
  },

  listTargetConsents(targetId: ApiId) {
    return apiClient.get<Consent[]>(`/targets/${targetId}/consents`)
  },

  revokeConsent(consentId: ApiId) {
    return apiClient.patch<Consent>(`/consents/${consentId}/revoke`)
  },
}
