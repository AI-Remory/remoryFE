import { apiClient } from '../lib/apiClient'
import type { ApiId, DeletionRequest } from '../types/api'

type CreateDeletionRequestPayload = {
  target_type: string
  target_id?: ApiId | null
  reason?: string | null
}

export const deletionApi = {
  createDeletionRequest(payload: CreateDeletionRequestPayload) {
    return apiClient.post<DeletionRequest>('/deletion-requests', payload)
  },

  listDeletionRequests() {
    return apiClient.get<DeletionRequest[]>('/deletion-requests')
  },

  getDeletionRequest(requestId: ApiId) {
    return apiClient.get<DeletionRequest>(`/deletion-requests/${requestId}`)
  },

  cancelDeletionRequest(requestId: ApiId) {
    return apiClient.patch<DeletionRequest>(`/deletion-requests/${requestId}/cancel`)
  },
}
