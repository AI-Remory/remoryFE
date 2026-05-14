import { apiClient } from '../lib/apiClient'
import type { ApiId, DeletionRequest, PaginatedResponse, Report, VerificationRequest, VoiceProfile } from '../types/api'

type AdminListOptions = {
  status?: string
  page?: number
  size?: number
}

function toQuery(options: AdminListOptions = {}) {
  const params = new URLSearchParams()

  if (options.status) {
    params.set('status', options.status)
  }

  if (options.page) {
    params.set('page', String(options.page))
  }

  if (options.size) {
    params.set('size', String(options.size))
  }

  const query = params.toString()

  return query ? `?${query}` : ''
}

export const adminApi = {
  async listVerificationRequests(options: AdminListOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<VerificationRequest> | VerificationRequest[]>(
      `/admin/verification-requests${toQuery({ page: 1, size: 20, ...options })}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  approveVerificationRequest(requestId: ApiId, reviewer_note?: string) {
    return apiClient.patch<VerificationRequest>(`/admin/verification-requests/${requestId}/approve`, {
      reviewer_note: reviewer_note?.trim() || null,
    })
  },

  rejectVerificationRequest(requestId: ApiId, reject_reason: string) {
    return apiClient.patch<VerificationRequest>(`/admin/verification-requests/${requestId}/reject`, {
      reject_reason,
    })
  },

  needMoreInfoVerificationRequest(requestId: ApiId, reviewer_note: string) {
    return apiClient.patch<VerificationRequest>(`/admin/verification-requests/${requestId}/need-more-info`, {
      reviewer_note,
    })
  },

  listDeletionRequests() {
    return apiClient.get<DeletionRequest[]>('/admin/deletion-requests')
  },

  approveAndProcessDeletionRequest(requestId: ApiId) {
    return apiClient.patch<DeletionRequest>(`/admin/deletion-requests/${requestId}/approve-and-process`)
  },

  rejectDeletionRequest(requestId: ApiId) {
    return apiClient.patch<DeletionRequest>(`/admin/deletion-requests/${requestId}/reject`)
  },

  async listReports(options: AdminListOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<Report> | Report[]>(
      `/admin/reports${toQuery({ page: 1, size: 20, ...options })}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  updateReportStatus(reportId: ApiId, action: 'reviewing' | 'resolve' | 'reject' | 'action-taken') {
    return apiClient.patch<Report>(`/admin/reports/${reportId}/${action}`, {})
  },

  approveVoiceProfile(voiceProfileId: ApiId, review_note?: string) {
    return apiClient.patch<VoiceProfile>(`/admin/voice-profiles/${voiceProfileId}/approve`, {
      review_note: review_note?.trim() || null,
    })
  },

  rejectVoiceProfile(voiceProfileId: ApiId, review_note?: string) {
    return apiClient.patch<VoiceProfile>(`/admin/voice-profiles/${voiceProfileId}/reject`, {
      review_note: review_note?.trim() || null,
    })
  },
}
