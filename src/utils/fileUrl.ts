import { API_BASE_URL } from '../services/apiClient'

function getApiOrigin() {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return new URL(API_BASE_URL).origin
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function toPlayableFileUrl(filePath: string) {
  if (/^(https?:|blob:|data:)/i.test(filePath)) {
    return filePath
  }

  const origin = getApiOrigin()
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`

  return `${origin}${normalizedPath}`
}
