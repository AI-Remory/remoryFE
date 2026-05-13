import { apiClient } from './apiClient'
import type {
  PaginatedTargetResponse,
  TargetCreateRequest,
  TargetDetailResponse,
  TargetId,
  TargetListParams,
  TargetResponse,
  TargetUpdateRequest,
} from '../types/target'

function buildListPath(params: TargetListParams = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('skip', String(params.skip ?? 0))
  searchParams.set('limit', String(params.limit ?? 20))

  return `/targets?${searchParams.toString()}`
}

export const targetService = {
  listTargets(params?: TargetListParams) {
    return apiClient.get<PaginatedTargetResponse>(buildListPath(params))
  },

  getTarget(targetId: TargetId) {
    return apiClient.get<TargetDetailResponse>(`/targets/${targetId}`)
  },

  createTarget(payload: TargetCreateRequest) {
    return apiClient.post<TargetResponse>('/targets', payload)
  },

  updateTarget(targetId: TargetId, payload: TargetUpdateRequest) {
    return apiClient.put<TargetResponse>(`/targets/${targetId}`, payload)
  },

  deleteTarget(targetId: TargetId) {
    return apiClient.delete<void>(`/targets/${targetId}`)
  },
}
