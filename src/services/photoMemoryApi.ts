import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedResponse, PhotoMemory } from '../types/api'

type CreatePhotoMemoryPayload = {
  title: string
  description?: string
  taken_at?: string
  location?: string
  file?: File
}

function normalizeTakenAt(value?: string) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.includes('T')) {
    return trimmed
  }

  return `${trimmed}T00:00:00`
}

function toCreatePhotoMemoryBody(payload: CreatePhotoMemoryPayload) {
  const title = payload.title.trim()

  if (!title) {
    throw new Error('사진 기억 제목을 입력해주세요.')
  }

  if (!payload.file) {
    throw new Error('업로드할 사진 파일을 선택해주세요.')
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('file', payload.file)

  if (payload.description?.trim()) {
    formData.append('description', payload.description.trim())
  }

  const takenAt = normalizeTakenAt(payload.taken_at)

  if (takenAt) {
    formData.append('taken_at', takenAt)
  }

  if (payload.location?.trim()) {
    formData.append('location', payload.location.trim())
  }

  return formData
}

export const photoMemoryApi = {
  async listPhotoMemories(skip = 0, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<PhotoMemory> | PhotoMemory[]>(
      `/photo-memories?skip=${skip}&limit=${limit}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  getPhotoMemory(photoMemoryId: ApiId) {
    return apiClient.get<PhotoMemory>(`/photo-memories/${photoMemoryId}`)
  },

  createPhotoMemory(payload: CreatePhotoMemoryPayload) {
    return apiClient.post<PhotoMemory>('/photo-memories', toCreatePhotoMemoryBody(payload))
  },

  deletePhotoMemory(photoMemoryId: ApiId) {
    return apiClient.delete<void>(`/photo-memories/${photoMemoryId}`)
  },
}
