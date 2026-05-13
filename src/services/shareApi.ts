import { apiClient } from '../lib/apiClient'
import type {
  ApiId,
  PublicSharedStoryBook,
  ShareLink,
  ShareLinkDisableResponse,
} from '../types/api'

export const shareApi = {
  createShareLink(storybookId: ApiId, expires_at?: string | null) {
    const body = expires_at ? { expires_at } : {}

    return apiClient.post<ShareLink>(`/storybooks/${storybookId}/share-links`, body)
  },

  listShareLinks(storybookId: ApiId) {
    return apiClient.get<ShareLink[]>(`/storybooks/${storybookId}/share-links`)
  },

  getPublicShare(token: string) {
    return apiClient.get<PublicSharedStoryBook>(`/share/${encodeURIComponent(token)}`, { auth: false })
  },

  disableShareLink(shareLinkId: ApiId) {
    return apiClient.patch<ShareLinkDisableResponse>(`/share-links/${shareLinkId}/disable`)
  },
}
