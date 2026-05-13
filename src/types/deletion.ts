export type DeletionTargetType =
  | 'TARGET'
  | 'TARGET_MEDIA'
  | 'PERSONA'
  | 'PERSONA_CHAT'
  | 'PERSONA_MESSAGE'
  | 'PHOTO_MEMORY'
  | 'STORYBOOK'
  | 'SHARE_LINK'
  | 'MEMORY_GROUP'
  | 'VERIFICATION_REQUEST'
  | 'ACCOUNT'
  | 'VOICE_PROFILE'
  | 'VOICE_CALL_SESSION'

export type DeletionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'CANCELLED'

export type DeletionRequestCreateRequest = {
  target_type: DeletionTargetType
  target_id?: number | null
  reason?: string | null
}

export type DeletionRequestResponse = {
  created_at: string
  updated_at: string
  id: number
  user_id: number
  target_type: DeletionTargetType
  target_id: number | null
  reason: string | null
  status: DeletionStatus
  requested_at: string
  processed_at: string | null
  processed_by: number | null
  admin_note: string | null
  error_message: string | null
}
