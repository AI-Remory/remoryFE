import { apiClient } from '../lib/apiClient'
import type { ApiId, StoryBook, StoryBookDetail, StoryChapter } from '../types/api'

type CreateStorybookPayload = {
  title: string
  persona_id?: ApiId
  chat_id?: ApiId
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
