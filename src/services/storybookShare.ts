import { ApiError } from '../lib/apiClient'
import type { ApiId, ShareLink } from '../types/api'
import { consentApi } from './consentApi'
import { shareApi } from './shareApi'

export function isStorybookShareConsentError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false
  }

  const detailText = typeof error.detail === 'string'
    ? error.detail
    : JSON.stringify(error.detail ?? '')

  return `${error.message} ${detailText}`.includes('storybook_share_consent')
}

export async function createShareLinkWithConsentRetry(storybookId: ApiId): Promise<ShareLink> {
  try {
    return await shareApi.createShareLink(storybookId)
  } catch (error) {
    if (!isStorybookShareConsentError(error)) {
      throw error
    }
  }

  await consentApi.createStorybookShareConsent()

  try {
    return await shareApi.createShareLink(storybookId)
  } catch (error) {
    if (isStorybookShareConsentError(error)) {
      throw new Error('스토리북 공유 동의가 필요합니다. 다시 시도해주세요.', { cause: error })
    }

    throw error
  }
}
