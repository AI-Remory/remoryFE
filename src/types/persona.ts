export type PersonaId = number
export type PersonaStatus = 'PENDING' | 'READY' | 'FAILED'

import type { PersonaVoiceProfileResponse } from './voiceProfile'

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
