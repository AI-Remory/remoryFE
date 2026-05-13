export type PersonaId = number
export type PersonaStatus = 'PENDING' | 'READY' | 'FAILED'

export type VoiceProfileStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'NEEDS_MORE_SAMPLES' | 'REVOKED'
export type VoiceProfileReviewStatus = 'NOT_REVIEWED' | 'USER_CONFIRMED' | 'ADMIN_APPROVED' | 'REJECTED'

export type PersonaVoiceProfileResponse = {
  created_at: string
  updated_at: string
  id: number
  persona_id: PersonaId
  target_id?: number | null
  provider?: string | null
  model_name?: string | null
  status?: VoiceProfileStatus | null
  review_status?: VoiceProfileReviewStatus | null
  reference_audio_count?: number | null
  reference_audio_total_seconds?: number | null
  reference_audio_paths_json?: string[] | null
  total_reference_duration_ms?: number | null
  voice_profile_path?: string | null
  sample_audio_path?: string | null
  quality_score?: number | null
  similarity_score?: number | null
  noise_score?: number | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  review_note?: string | null
  error_message?: string | null
  reference_voice_file_path: string | null
  reference_voice_mime_type: string | null
  reference_voice_duration: number | null
  voice_provider: string | null
  voice_id: string | null
  voice_name: string | null
  metadata?: Record<string, unknown> | null
}

export type PersonaDetailResponse = {
  created_at: string
  updated_at: string
  id: PersonaId
  target_id: number
  status: PersonaStatus
  persona_name: string | null
  speaking_style: string | null
  personality_summary: string | null
  memory_summary: string | null
  system_prompt: string | null
  is_voice_profile_created: boolean
  is_consent_required: boolean
  voice_profile?: PersonaVoiceProfileResponse | null
}

export type PersonaStatusResponse = {
  persona_id: PersonaId
  target_id: number
  status: PersonaStatus
}
