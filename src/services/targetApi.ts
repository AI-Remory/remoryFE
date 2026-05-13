import { apiClient } from '../lib/apiClient'
import type {
  ApiId,
  PaginatedTargets,
  Persona,
  Target,
  TargetMedia,
  TargetMediaUploadResponse,
} from '../types/api'

type CreateTargetPayload = {
  name: string
  description?: string | null
  target_type: string
}

type UpdateTargetPayload = Partial<CreateTargetPayload>

export const targetApi = {
  async listTargets(skip = 0, limit = 20) {
    const response = await apiClient.get<PaginatedTargets | Target[]>(`/targets?skip=${skip}&limit=${limit}`)

    return Array.isArray(response) ? { items: response } : response
  },

  getTarget(targetId: ApiId) {
    return apiClient.get<Target>(`/targets/${targetId}`)
  },

  createTarget(payload: CreateTargetPayload) {
    return apiClient.post<Target>('/targets', payload)
  },

  updateTarget(targetId: ApiId, payload: UpdateTargetPayload) {
    return apiClient.put<Target>(`/targets/${targetId}`, payload)
  },

  deleteTarget(targetId: ApiId) {
    return apiClient.delete<void>(`/targets/${targetId}`)
  },

  createPersona(targetId: ApiId) {
    return apiClient.post<Persona>(`/targets/${targetId}/persona`)
  },

  uploadTargetMedia(targetId: ApiId, mediaType: 'image' | 'voice', file: File) {
    const formData = new FormData()
    formData.append('media_type', mediaType)
    formData.append('file', file)

    return apiClient.post<TargetMediaUploadResponse>(`/targets/${targetId}/media`, formData)
  },

  listTargetMedia(targetId: ApiId) {
    return apiClient.get<TargetMedia[]>(`/targets/${targetId}/media`)
  },

  deleteMedia(mediaId: ApiId) {
    return apiClient.delete<void>(`/media/${mediaId}`)
  },
}
