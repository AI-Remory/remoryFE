import type { DeletionRequestResponse } from './deletion'
import type { PersonaVoiceProfileResponse } from './voiceProfile'
import type { ReportResponse } from './report'
import type { VerificationStatus, VerificationType } from './verification'

export type PaginatedResponse<T> = {
  total: number
  skip: number
  limit: number
  items: T[]
}

export type VerificationRequestAdminResponse = {
  id: number
  user_id: number
  target_id: number
  verification_type: VerificationType
  status: VerificationStatus
  original_filename: string
  mime_type: string
  file_size: number
  applicant_note?: string | null
  admin_note?: string | null
  rejection_reason?: string | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string
}

export type VerificationRequestApproveRequest = {
  admin_note?: string | null
  expires_at?: string | null
}

export type VerificationRequestRejectRequest = {
  rejection_reason: string
  admin_note?: string | null
}

export type VerificationRequestNeedMoreInfoRequest = {
  admin_note: string
}

export type VerificationRequestRevokeRequest = {
  admin_note?: string | null
}

export type AuditAction =
  | 'USER_SIGNUP'
  | 'TARGET_CREATED'
  | 'TARGET_UPDATED'
  | 'TARGET_DELETED'
  | 'CONSENT_CREATED'
  | 'CONSENT_REVOKED'
  | 'VERIFICATION_SUBMITTED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'VERIFICATION_NEED_MORE_INFO'
  | 'VERIFICATION_REVOKED'
  | 'PERSONA_CREATED'
  | 'PERSONA_CHAT_CREATED'
  | 'PERSONA_MESSAGE_CREATED'
  | 'VOICE_PROFILE_CREATED'
  | 'VOICE_PROFILE_REVIEWED'
  | 'VOICE_SYNTHESIZED'
  | 'VOICE_CALL_STARTED'
  | 'VOICE_CALL_ENDED'
  | 'DELETION_REQUESTED'
  | 'DELETION_COMPLETED'
  | 'DELETION_REJECTED'
  | 'REPORT_CREATED'
  | 'REPORT_RESOLVED'
  | 'REPORT_REVIEWING'
  | 'REPORT_REJECTED'
  | 'REPORT_ACTION_TAKEN'
  | 'RATE_LIMIT_BLOCKED'
  | 'ABNORMAL_REQUEST_BLOCKED'

export type AuditTargetType =
  | 'TARGET'
  | 'CONSENT'
  | 'VERIFICATION_REQUEST'
  | 'PERSONA'
  | 'PERSONA_CHAT'
  | 'PERSONA_MESSAGE'
  | 'VOICE_PROFILE'
  | 'DELETION_REQUEST'
  | 'REPORT'
  | 'USER'
  | 'SYSTEM'

export type AuditLogResponse = {
  id: number
  actor_user_id?: number | null
  action: AuditAction
  target_type?: AuditTargetType | null
  target_id?: number | null
  description?: string | null
  metadata_json?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export type UsageLimitResponse = {
  id: number
  user_id: number
  period_ym: string
  voice_generation_count: number
  voice_generation_limit: number
  voice_generation_remaining: number
  stt_request_count: number
  stt_request_limit: number
  stt_request_remaining: number
  voice_call_seconds: number
  voice_call_seconds_limit: number
  voice_call_seconds_remaining: number
  created_at: string
  updated_at: string
}

export type UpdateUsageLimitRequest = {
  voice_generation_limit?: number | null
  stt_request_limit?: number | null
  voice_call_seconds_limit?: number | null
}

export type PersonaUsageLimitResponse = {
  id: number
  persona_id: number
  period_ym: string
  voice_generation_count: number
  voice_generation_limit: number
  voice_generation_remaining: number
  voice_call_seconds: number
  voice_call_seconds_limit: number
  voice_call_seconds_remaining: number
  created_at: string
  updated_at: string
}

export type UpdatePersonaUsageLimitRequest = {
  voice_generation_limit?: number | null
  voice_call_seconds_limit?: number | null
}

export type RateLimitEventResponse = {
  id: number
  user_id?: number | null
  ip_address?: string | null
  endpoint: string
  event_type: string
  count: number
  window_seconds?: number | null
  blocked: boolean
  reason?: string | null
  created_at: string
}

export type VoiceProfileReviewRequest = {
  review_note?: string | null
}

// TODO: OpenAPI uses an untyped object for admin report responses.
// Keep this generic until backend exposes a concrete admin report schema.
export type AdminReportResponse = Record<string, unknown>

export type AdminReportAction = 'reviewing' | 'resolve' | 'reject' | 'action-taken'

export type AdminDashboardSnapshot = {
  verificationRequests: PaginatedResponse<VerificationRequestAdminResponse> | null
  reports: PaginatedResponse<AdminReportResponse> | null
  auditLogs: PaginatedResponse<AuditLogResponse> | null
  usageLimits: PaginatedResponse<UsageLimitResponse> | null
  rateLimitEvents: PaginatedResponse<RateLimitEventResponse> | null
}

export type AdminDeletionRequestResponse = DeletionRequestResponse
export type AdminVoiceProfileResponse = PersonaVoiceProfileResponse
export type AdminTypedReportResponse = ReportResponse
