export type ReportTargetType = 'PERSONA' | 'PERSONA_CHAT' | 'PERSONA_MESSAGE' | 'STORYBOOK' | 'SHARE_LINK' | 'TARGET' | 'USER'

export type ReportReasonType =
  | 'UNAUTHORIZED_VOICE_USE'
  | 'PRIVACY_VIOLATION'
  | 'HARMFUL_CONTENT'
  | 'IMPERSONATION'
  | 'COPYRIGHT_OR_RIGHTS'
  | 'SPAM'
  | 'OTHER'

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED' | 'ACTION_TAKEN'

export type CreateReportRequest = {
  target_type: ReportTargetType
  target_id: number
  reason_type: ReportReasonType
  reason_detail?: string | null
}

export type ReportResponse = {
  created_at: string
  updated_at: string
  id: number
  reporter_user_id: number
  target_type: ReportTargetType
  target_id: number
  reason_type: ReportReasonType
  reason_detail?: string | null
  status: ReportStatus
  reviewed_by?: number | null
  reviewed_at?: string | null
  admin_note?: string | null
}

export type PaginatedReportResponse = {
  total: number
  skip: number
  limit: number
  items: ReportResponse[]
}
