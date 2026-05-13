import { apiClient } from './apiClient'
import type {
  PaginatedVerificationRequestResponse,
  VerificationCreatePayload,
  VerificationListParams,
  VerificationRequestDetailResponse,
  VerificationRequestResponse,
} from '../types/verification'

function buildListPath(targetId: number, params: VerificationListParams = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('skip', String(params.skip ?? 0))
  searchParams.set('limit', String(params.limit ?? 20))

  return `/targets/${targetId}/verification-requests?${searchParams.toString()}`
}

export const verificationService = {
  listTargetVerificationRequests(targetId: number, params?: VerificationListParams) {
    return apiClient.get<PaginatedVerificationRequestResponse>(buildListPath(targetId, params))
  },

  getVerificationRequest(requestId: number) {
    return apiClient.get<VerificationRequestDetailResponse>(`/verification-requests/${requestId}`)
  },

  createVerificationRequest(targetId: number, payload: VerificationCreatePayload) {
    const formData = new FormData()
    formData.append('verification_type_param', payload.verification_type_param)

    if (payload.applicant_note) {
      formData.append('applicant_note', payload.applicant_note)
    }

    formData.append('file', payload.file)

    return apiClient.post<VerificationRequestResponse>(`/targets/${targetId}/verification-requests`, formData)
  },
}

