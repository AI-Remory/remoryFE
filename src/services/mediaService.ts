import { apiClient } from './apiClient'
import type { MediaDeleteResponse, MediaId, MediaType, MediaUploadResponse, TargetMediaResponse } from '../types/media'

export const mediaService = {
  listTargetMedia(targetId: number) {
    return apiClient.get<TargetMediaResponse[]>(`/targets/${targetId}/media`)
  },

  uploadTargetMedia(targetId: number, mediaType: MediaType, file: File) {
    const formData = new FormData()
    formData.append('media_type', mediaType)
    formData.append('file', file)

    return apiClient.post<MediaUploadResponse>(`/targets/${targetId}/media`, formData)
  },

  deleteMedia(mediaId: MediaId) {
    return apiClient.delete<MediaDeleteResponse>(`/media/${mediaId}`)
  },
}
