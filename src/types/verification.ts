export type VerificationType = 'FAMILY_RELATION_CERTIFICATE' | 'ID_CARD' | 'SELF_DECLARATION' | 'OTHER'

export type VerificationStatus = 'PENDING' | 'NEED_MORE_INFO' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED'

export type VerificationRequestResponse = {
  id: number
  user_id: number
  target_id: number
  verification_type: VerificationType
  status: VerificationStatus
  original_filename: string
  mime_type: string
  file_size: number
  applicant_note: string | null
  admin_note: string | null
  rejection_reason: string | null
  reviewed_by: number | null
  reviewed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type VerificationRequestDetailResponse = VerificationRequestResponse

export type PaginatedVerificationRequestResponse = {
  total: number
  skip: number
  limit: number
  items: VerificationRequestResponse[]
}

export type VerificationListParams = {
  skip?: number
  limit?: number
}

export type VerificationCreatePayload = {
  verification_type_param: VerificationType
  applicant_note?: string | null
  file: File
}

