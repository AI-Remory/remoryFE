import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedResponse, PhotoMemory } from '../types/api'

type CreatePhotoMemoryPayload = {
  target_id?: ApiId
  title?: string
  caption?: string
  description?: string
  memory_date?: string
  taken_at?: string
  file?: File
  image?: File
}

function toCreatePhotoMemoryBody(payload: CreatePhotoMemoryPayload) {
  const file = payload.file ?? payload.image

  if (!file) {
    return payload
  }

  const formData = new FormData()
  formData.append('file', file)

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'file' || key === 'image' || value === undefined || value === null) {
      return
    }

    formData.append(key, String(value))
  })

  return formData
}

export const photoMemoryApi = {
  async listPhotoMemories(skip = 0, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<PhotoMemory> | PhotoMemory[]>(
      `/photo-memories?skip=${skip}&limit=${limit}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  createPhotoMemory(payload: CreatePhotoMemoryPayload) {
    return apiClient.post<PhotoMemory>('/photo-memories', toCreatePhotoMemoryBody(payload))
  },
}
