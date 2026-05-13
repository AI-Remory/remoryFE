import { apiClient } from './apiClient'
import type {
  GroupMemberCreateRequest,
  GroupMemberResponse,
  GroupStoryBookListItemResponse,
  GroupStoryBookResponse,
  MemoryGroupCreateRequest,
  MemoryGroupDetailResponse,
  MemoryGroupResponse,
} from '../types/group'

export const groupService = {
  listGroups() {
    return apiClient.get<MemoryGroupResponse[]>('/groups')
  },

  createGroup(payload: MemoryGroupCreateRequest) {
    return apiClient.post<MemoryGroupResponse>('/groups', payload)
  },

  getGroup(groupId: number) {
    return apiClient.get<MemoryGroupDetailResponse>(`/groups/${groupId}`)
  },

  addGroupMember(groupId: number, payload: GroupMemberCreateRequest) {
    return apiClient.post<GroupMemberResponse>(`/groups/${groupId}/members`, payload)
  },

  listGroupMembers(groupId: number) {
    return apiClient.get<GroupMemberResponse[]>(`/groups/${groupId}/members`)
  },

  shareStorybookToGroup(groupId: number, storybookId: number) {
    return apiClient.post<GroupStoryBookResponse>(`/groups/${groupId}/storybooks/${storybookId}`)
  },

  listGroupStorybooks(groupId: number) {
    return apiClient.get<GroupStoryBookListItemResponse[]>(`/groups/${groupId}/storybooks`)
  },
}
