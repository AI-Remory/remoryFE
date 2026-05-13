export type ConsentType =
  | 'target_profile_consent'
  | 'photo_upload_consent'
  | 'voice_upload_consent'
  | 'voice_cloning_consent'
  | 'ai_persona_creation_consent'
  | 'ai_response_notice_consent'
  | 'storybook_share_consent'
  | 'group_share_consent'
  | 'data_retention_consent'
  | 'third_party_ai_processing_consent'
  | 'voice_collection'
  | 'photo_collection'
  | 'persona_creation'
  | 'data_usage'
  | 'ai_processing'
  | 'ai_response_notice'
  | 'storybook_share'

export type ConsentCreate = {
  target_id?: number | null
  consent_type: ConsentType
  consent_version?: string
  consent_text_snapshot?: string | null
  is_agreed?: boolean | null
  is_consented?: boolean | null
  details?: string | null
}

export type ConsentResponse = {
  created_at: string
  updated_at: string
  id: number
  user_id: number
  target_id: number | null
  consent_type: ConsentType
  consent_version: string
  consent_text_snapshot: string | null
  is_agreed: boolean
  agreed_at: string | null
  revoked_at: string | null
  ip_address: string | null
  user_agent: string | null
  is_consented: boolean
  details: string | null
}

export type ConsentRevokeResponse = ConsentResponse

