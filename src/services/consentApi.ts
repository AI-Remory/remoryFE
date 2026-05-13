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
  consent_version?: string
  consent_text_snapshot?: string
  is_agreed?: boolean
  is_consented?: boolean
  details?: string | null
}

const DEFAULT_CONSENT_TEXT =
  'Remory 서비스 이용을 위해 개인정보, 사진, 음성, AI 페르소나 생성, AI 응답 고지, 데이터 보관 및 외부 AI 처리에 동의합니다.'

export const consentApi = {
  createConsent(payload: CreateConsentPayload) {
    const body = {
      target_id: payload.target_id,
      consent_type: payload.consent_type,
      consent_version: payload.consent_version ?? 'v1',
      consent_text_snapshot: payload.consent_text_snapshot ?? DEFAULT_CONSENT_TEXT,
      is_agreed: payload.is_agreed ?? true,
      is_consented: payload.is_consented ?? true,
      details:
        payload.details ??
        JSON.stringify({
          source: 'setup',
          agreed_at: new Date().toISOString(),
        }),
    }

    return apiClient.post<Consent>('/consents', body)
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
