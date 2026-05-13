export type StoryBookVisibility = 'PRIVATE' | 'LINK' | 'GROUP' | 'PUBLIC'
export type StoryBookSourceType = 'INTERVIEW' | 'PHOTO_MEMORY' | 'SELF_STORY'
export type StoryBookStatus = 'DRAFT' | 'GENERATED' | 'FAILED'

export type StoryBookCreateRequest = {
  title: string
  interview_session_id?: number | null
  photo_memory_id?: number | null
  visibility?: StoryBookVisibility
}

export type StoryBookResponse = {
  created_at: string
  updated_at: string
  id: number
  user_id: number
  photo_memory_id: number | null
  interview_session_id: number | null
  title: string
  summary: string | null
  source_type: StoryBookSourceType
  status: StoryBookStatus
  visibility: StoryBookVisibility
  deleted_at: string | null
}

export type StoryChapterResponse = {
  created_at: string
  updated_at: string
  id: number
  storybook_id: number
  title: string
  content: string
  summary: string | null
  order_index: number
  deleted_at: string | null
}

export type StoryBookDetailResponse = StoryBookResponse & {
  chapters?: StoryChapterResponse[]
}

