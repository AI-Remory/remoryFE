import { apiClient } from './apiClient'
import type { ApiId, StoryBook, StoryBookDetail, StoryChapter } from '../types/api'

type CreateStorybookPayload = {
  title: string
  interview_session_id?: ApiId | null
  photo_memory_id?: ApiId | null
  visibility?: 'PRIVATE' | 'LINK' | 'GROUP' | 'PUBLIC'
}

export const storybookApi = {
  listStorybooks() {
    return apiClient.get<StoryBook[]>('/storybooks')
  },

  getStorybook(storybookId: ApiId) {
    return apiClient.get<StoryBookDetail>(`/storybooks/${storybookId}`)
  },

  listChapters(storybookId: ApiId) {
    return apiClient.get<StoryChapter[]>(`/storybooks/${storybookId}/chapters`)
  },

  createStorybook(payload: CreateStorybookPayload) {
    return apiClient.post<StoryBook>('/storybooks', payload)
  },
}
