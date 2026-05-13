import { apiClient } from './apiClient'
import type {
  PublicSharedStoryBookResponse,
  ShareLinkCreateRequest,
  ShareLinkDisableResponse,
  ShareLinkResponse,
} from '../types/shareLink'

export const shareLinkService = {
  createShareLink(storybookId: number, payload?: ShareLinkCreateRequest | null) {
    return apiClient.post<ShareLinkResponse>(`/storybooks/${storybookId}/share-links`, payload ?? null)
  },

  listShareLinks(storybookId: number) {
    return apiClient.get<ShareLinkResponse[]>(`/storybooks/${storybookId}/share-links`)
  },

  getPublicSharedStorybook(token: string) {
    return apiClient.get<PublicSharedStoryBookResponse>(`/share/${encodeURIComponent(token)}`, { auth: false })
  },

  disableShareLink(shareLinkId: number) {
    return apiClient.patch<ShareLinkDisableResponse>(`/share-links/${shareLinkId}/disable`)
  },
}

