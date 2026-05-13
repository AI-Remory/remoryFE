import type { StoryBookVisibility } from './storybook'

export type GroupMemberRole = 'OWNER' | 'MEMBER' | 'VIEWER'

export type MemoryGroupCreateRequest = {
  name: string
  description?: string | null
}

export type MemoryGroupResponse = {
  created_at: string
  updated_at: string
  id: number
  owner_id: number
  name: string
  description: string | null
  deleted_at: string | null
}

export type MemoryGroupDetailResponse = MemoryGroupResponse & {
  my_role: GroupMemberRole
}

export type GroupMemberCreateRequest = {
  user_id: number
  role?: GroupMemberRole
}

export type GroupMemberResponse = {
  created_at: string
  updated_at: string
  id: number
  group_id: number
  user_id: number
  role: GroupMemberRole
  deleted_at: string | null
}

export type GroupStoryBookResponse = {
  id: number
  group_id: number
  storybook_id: number
  shared_by: number
  created_at: string
}

export type GroupStoryBookListItemResponse = {
  id: number
  title: string
  summary: string | null
  visibility: StoryBookVisibility
  created_at: string
}
