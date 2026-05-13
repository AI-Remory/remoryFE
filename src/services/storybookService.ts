import { apiClient } from './apiClient'
import type {
  StoryBookCreateRequest,
  StoryBookDetailResponse,
  StoryBookResponse,
  StoryChapterResponse,
} from '../types/storybook'

export const storybookService = {
  listStorybooks() {
    return apiClient.get<StoryBookResponse[]>('/storybooks')
  },

  createStorybook(payload: StoryBookCreateRequest) {
    return apiClient.post<StoryBookDetailResponse>('/storybooks', payload)
  },

  getStorybook(storybookId: number) {
    return apiClient.get<StoryBookDetailResponse>(`/storybooks/${storybookId}`)
  },

  listChapters(storybookId: number) {
    return apiClient.get<StoryChapterResponse[]>(`/storybooks/${storybookId}/chapters`)
  },

  regenerateStorybook(storybookId: number) {
    return apiClient.post<StoryBookDetailResponse>(`/storybooks/${storybookId}/regenerate`)
  },
}

