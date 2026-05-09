import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedTargets, Persona, Target, TargetMediaUploadResponse } from '../types/api'

type CreateTargetPayload = {
  name: string
  description?: string | null
  target_type: string
}

export const targetApi = {
  async listTargets() {
    const response = await apiClient.get<PaginatedTargets | Target[]>('/targets?skip=0&limit=20')

    return Array.isArray(response) ? { items: response } : response
  },

  getTarget(targetId: ApiId) {
    return apiClient.get<Target>(`/targets/${targetId}`)
  },

  createTarget(payload: CreateTargetPayload) {
    return apiClient.post<Target>('/targets', payload)
  },

  createPersona(targetId: ApiId) {
    return apiClient.post<Persona>(`/targets/${targetId}/persona`)
  },

  uploadTargetMedia(targetId: ApiId, mediaType: string, file: File) {
    const formData = new FormData()
    formData.append('media_type', mediaType)
    formData.append('file', file)

    return apiClient.post<TargetMediaUploadResponse>(`/targets/${targetId}/media`, formData)
  },
}
