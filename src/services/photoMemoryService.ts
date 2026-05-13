import { apiClient } from './apiClient'
import type { PhotoMemoryCreatePayload, PhotoMemoryDeleteResponse, PhotoMemoryResponse } from '../types/photoMemory'

export const photoMemoryService = {
  listPhotoMemories() {
    return apiClient.get<PhotoMemoryResponse[]>('/photo-memories')
  },

  getPhotoMemory(photoMemoryId: number) {
    return apiClient.get<PhotoMemoryResponse>(`/photo-memories/${photoMemoryId}`)
  },

  createPhotoMemory(payload: PhotoMemoryCreatePayload) {
    const formData = new FormData()
    formData.append('title', payload.title)

    if (payload.description) {
      formData.append('description', payload.description)
    }

    if (payload.taken_at) {
      formData.append('taken_at', payload.taken_at)
    }

    if (payload.location) {
      formData.append('location', payload.location)
    }

    formData.append('file', payload.file)

    return apiClient.post<PhotoMemoryResponse>('/photo-memories', formData)
  },

  deletePhotoMemory(photoMemoryId: number) {
    return apiClient.delete<PhotoMemoryDeleteResponse>(`/photo-memories/${photoMemoryId}`)
  },
}

