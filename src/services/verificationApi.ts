import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedResponse, VerificationRequest, VerificationType } from '../types/api'

type CreateVerificationRequestPayload = {
  verification_type_param: VerificationType
  applicant_note: string
  file: File
}

export const verificationApi = {
  createVerificationRequest(targetId: ApiId, payload: CreateVerificationRequestPayload) {
    const formData = new FormData()
    formData.append('verification_type_param', payload.verification_type_param)
    formData.append('applicant_note', payload.applicant_note)
    formData.append('file', payload.file)

    return apiClient.post<VerificationRequest>(`/targets/${targetId}/verification-requests`, formData)
  },

  async listTargetVerificationRequests(targetId: ApiId, skip = 0, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<VerificationRequest> | VerificationRequest[]>(
      `/targets/${targetId}/verification-requests?skip=${skip}&limit=${limit}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  getVerificationRequest(requestId: ApiId) {
    return apiClient.get<VerificationRequest>(`/verification-requests/${requestId}`)
  },
}
