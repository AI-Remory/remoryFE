import { apiClient } from '../lib/apiClient'
import type { ApiId, PaginatedResponse, StoryBook, StoryBookDetail, StoryChapter } from '../types/api'

type CreateStorybookPayload = {
  title: string
  interview_session_id?: ApiId | null
  photo_memory_id?: ApiId | null
  visibility?: 'PRIVATE' | 'LINK' | 'GROUP' | 'PUBLIC'
}

export const storybookApi = {
  async listStorybooks(skip = 0, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<StoryBook> | StoryBook[]>(
      `/storybooks?skip=${skip}&limit=${limit}`,
    )

    return Array.isArray(response) ? response : response.items
  },

  getStorybook(storybookId: ApiId) {
    return apiClient.get<StoryBookDetail>(`/storybooks/${storybookId}`)
  },

  async listChapters(storybookId: ApiId) {
    const response = await apiClient.get<PaginatedResponse<StoryChapter> | StoryChapter[]>(
      `/storybooks/${storybookId}/chapters`,
    )

    return Array.isArray(response) ? response : response.items
  },

  createStorybook(payload: CreateStorybookPayload) {
    return apiClient.post<StoryBook>('/storybooks', payload)
  },

  regenerateStorybook(storybookId: ApiId) {
    return apiClient.post<StoryBookDetail>(`/storybooks/${storybookId}/regenerate`)
  },
}
