import type { StoryBookVisibility } from './storybook'

export type ShareLinkCreateRequest = {
  expires_at?: string | null
}

export type ShareLinkResponse = {
  created_at: string
  updated_at: string
  id: number
  storybook_id: number
  owner_id: number
  token: string
  is_active: boolean
  expires_at: string | null
  disabled_at: string | null
  share_url: string
}

export type ShareLinkDisableResponse = {
  id: number
  is_active: boolean
  disabled_at: string | null
}

export type PublicStoryChapterResponse = {
  title: string
  content: string
  summary: string | null
  order_index: number
}

export type PublicSharedStoryBookResponse = {
  title: string
  summary: string | null
  visibility: StoryBookVisibility
  chapters: PublicStoryChapterResponse[]
}

