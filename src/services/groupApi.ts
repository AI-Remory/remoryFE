import { apiClient } from '../lib/apiClient'
import type { ApiId, GroupMember, GroupStoryBookListItem, MemoryGroup, MemoryGroupDetail } from '../types/api'

type CreateGroupPayload = {
  name: string
  description?: string | null
}

type AddGroupMemberPayload = {
  user_id: ApiId
  role?: 'OWNER' | 'MEMBER' | 'VIEWER' | string
}

export const groupApi = {
  createGroup(payload: CreateGroupPayload) {
    return apiClient.post<MemoryGroup>('/groups', payload)
  },

  listGroups() {
    return apiClient.get<MemoryGroup[]>('/groups')
  },

  getGroup(groupId: ApiId) {
    return apiClient.get<MemoryGroupDetail>(`/groups/${groupId}`)
  },

  addMember(groupId: ApiId, payload: AddGroupMemberPayload) {
    return apiClient.post<GroupMember>(`/groups/${groupId}/members`, payload)
  },

  listMembers(groupId: ApiId) {
    return apiClient.get<GroupMember[]>(`/groups/${groupId}/members`)
  },

  addStorybook(groupId: ApiId, storybookId: ApiId) {
    return apiClient.post<GroupStoryBookListItem>(`/groups/${groupId}/storybooks/${storybookId}`)
  },

  listStorybooks(groupId: ApiId) {
    return apiClient.get<GroupStoryBookListItem[]>(`/groups/${groupId}/storybooks`)
  },
}
