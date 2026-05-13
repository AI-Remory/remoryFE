import { storybookService } from './storybookService'
import type {
  StoryBookCreateRequest,
  StoryBookDetailResponse,
  StoryBookResponse,
  StoryChapterResponse,
} from '../types/storybook'

export const storybookApi = {
  listStorybooks() {
    return storybookService.listStorybooks()
  },

  getStorybook(storybookId: number) {
    return storybookService.getStorybook(storybookId)
  },

  listChapters(storybookId: number) {
    return storybookService.listChapters(storybookId)
  },

  createStorybook(payload: StoryBookCreateRequest) {
    return storybookService.createStorybook(payload)
  },
}

export type StoryBook = StoryBookResponse
export type StoryBookDetail = StoryBookDetailResponse
export type StoryChapter = StoryChapterResponse
