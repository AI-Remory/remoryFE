import { apiClient } from './apiClient'
import type { ReportStatus } from '../types/report'
import type { VerificationStatus } from '../types/verification'
import type { DeletionRequestResponse, DeletionStatus } from '../types/deletion'
import type {
  AdminReportAction,
  AdminReportResponse,
  AuditAction,
  AuditLogResponse,
  AuditTargetType,
  PaginatedResponse,
  PersonaUsageLimitResponse,
  RateLimitEventResponse,
  UpdatePersonaUsageLimitRequest,
  UpdateUsageLimitRequest,
  UsageLimitResponse,
  VerificationRequestAdminResponse,
  VerificationRequestApproveRequest,
  VerificationRequestNeedMoreInfoRequest,
  VerificationRequestRejectRequest,
  VerificationRequestRevokeRequest,
  VoiceProfileReviewRequest,
} from '../types/admin'
import type { PersonaVoiceProfileResponse } from '../types/voiceProfile'

function compactQuery(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const adminService = {
  listVerificationRequests(params: { status?: VerificationStatus | ''; page?: number; size?: number } = {}) {
    return apiClient.get<PaginatedResponse<VerificationRequestAdminResponse>>(
      `/admin/verification-requests${compactQuery(params)}`,
    )
  },

  getVerificationRequest(requestId: number) {
    return apiClient.get<VerificationRequestAdminResponse>(`/admin/verification-requests/${requestId}`)
  },

  downloadVerificationFile(requestId: number) {
    return apiClient.download(`/admin/verification-requests/${requestId}/file`)
  },

  approveVerificationRequest(requestId: number, payload: VerificationRequestApproveRequest | null) {
    return apiClient.patch<VerificationRequestAdminResponse>(`/admin/verification-requests/${requestId}/approve`, payload)
  },

  rejectVerificationRequest(requestId: number, payload: VerificationRequestRejectRequest) {
    return apiClient.patch<VerificationRequestAdminResponse>(`/admin/verification-requests/${requestId}/reject`, payload)
  },

  requestMoreVerificationInfo(requestId: number, payload: VerificationRequestNeedMoreInfoRequest) {
    return apiClient.patch<VerificationRequestAdminResponse>(`/admin/verification-requests/${requestId}/need-more-info`, payload)
  },

  revokeVerificationRequest(requestId: number, payload: VerificationRequestRevokeRequest | null) {
    return apiClient.patch<VerificationRequestAdminResponse>(`/admin/verification-requests/${requestId}/revoke`, payload)
  },

  listDeletionRequests(params: { status?: DeletionStatus | '' } = {}) {
    return apiClient.get<DeletionRequestResponse[]>(`/admin/deletion-requests${compactQuery(params)}`)
  },

  getDeletionRequest(requestId: number) {
    return apiClient.get<DeletionRequestResponse>(`/admin/deletion-requests/${requestId}`)
  },

  approveAndProcessDeletionRequest(requestId: number, adminNote?: string | null) {
    const query = compactQuery({ admin_note: adminNote ?? undefined })
    return apiClient.patch<DeletionRequestResponse>(`/admin/deletion-requests/${requestId}/approve-and-process${query}`)
  },

  rejectDeletionRequest(requestId: number, adminNote?: string | null) {
    const query = compactQuery({ admin_note: adminNote ?? undefined })
    return apiClient.patch<DeletionRequestResponse>(`/admin/deletion-requests/${requestId}/reject${query}`)
  },

  listReports(params: { status?: ReportStatus | ''; page?: number; size?: number } = {}) {
    return apiClient.get<PaginatedResponse<AdminReportResponse>>(`/admin/reports${compactQuery(params)}`)
  },

  getReport(reportId: number) {
    return apiClient.get<AdminReportResponse>(`/admin/reports/${reportId}`)
  },

  updateReport(reportId: number, action: AdminReportAction, payload: Record<string, unknown> | null) {
    return apiClient.patch<AdminReportResponse>(`/admin/reports/${reportId}/${action}`, payload)
  },

  listAuditLogs(params: {
    action?: AuditAction | ''
    actor_user_id?: number | null
    target_type?: AuditTargetType | ''
    target_id?: number | null
    start_date?: string
    end_date?: string
    page?: number
    size?: number
  } = {}) {
    return apiClient.get<PaginatedResponse<AuditLogResponse>>(`/admin/audit-logs${compactQuery(params)}`)
  },

  listUsageLimits(params: { user_id?: number | null; page?: number; size?: number } = {}) {
    return apiClient.get<PaginatedResponse<UsageLimitResponse>>(`/admin/usage-limits${compactQuery(params)}`)
  },

  updateUserUsageLimit(userId: number, payload: UpdateUsageLimitRequest) {
    return apiClient.patch<UsageLimitResponse>(`/admin/users/${userId}/usage-limit`, payload)
  },

  updatePersonaUsageLimit(personaId: number, payload: UpdatePersonaUsageLimitRequest) {
    return apiClient.patch<PersonaUsageLimitResponse>(`/admin/personas/${personaId}/usage-limit`, payload)
  },

  listRateLimitEvents(params: { user_id?: number | null; page?: number; size?: number } = {}) {
    return apiClient.get<PaginatedResponse<RateLimitEventResponse>>(`/admin/rate-limit-events${compactQuery(params)}`)
  },

  getVoiceProfile(voiceProfileId: number) {
    return apiClient.get<PersonaVoiceProfileResponse>(`/admin/voice-profiles/${voiceProfileId}`)
  },

  approveVoiceProfile(voiceProfileId: number, payload: VoiceProfileReviewRequest) {
    return apiClient.patch<PersonaVoiceProfileResponse>(`/admin/voice-profiles/${voiceProfileId}/approve`, payload)
  },

  rejectVoiceProfile(voiceProfileId: number, payload: VoiceProfileReviewRequest) {
    return apiClient.patch<PersonaVoiceProfileResponse>(`/admin/voice-profiles/${voiceProfileId}/reject`, payload)
  },

  revokeVoiceProfile(voiceProfileId: number, payload: VoiceProfileReviewRequest) {
    return apiClient.patch<PersonaVoiceProfileResponse>(`/admin/voice-profiles/${voiceProfileId}/revoke`, payload)
  },
}
