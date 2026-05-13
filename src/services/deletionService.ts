import { apiClient } from './apiClient'
import type { DeletionRequestCreateRequest, DeletionRequestResponse } from '../types/deletion'

export const deletionService = {
  listDeletionRequests() {
    return apiClient.get<DeletionRequestResponse[]>('/deletion-requests')
  },

  createDeletionRequest(payload: DeletionRequestCreateRequest) {
    return apiClient.post<DeletionRequestResponse>('/deletion-requests', payload)
  },

  getDeletionRequest(requestId: number) {
    return apiClient.get<DeletionRequestResponse>(`/deletion-requests/${requestId}`)
  },

  cancelDeletionRequest(requestId: number) {
    return apiClient.patch<DeletionRequestResponse>(`/deletion-requests/${requestId}/cancel`)
  },
}
