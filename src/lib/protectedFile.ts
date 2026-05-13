import { API_BASE_URL, getAccessToken } from './apiClient'

function normalizeProtectedFilePath(path: string) {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    throw new Error('파일 경로가 비어 있습니다.')
  }

  let pathnameWithSearch = trimmedPath

  if (/^https?:\/\//i.test(trimmedPath)) {
    const url = new URL(trimmedPath)
    pathnameWithSearch = `${url.pathname}${url.search}`
  }

  if (pathnameWithSearch.startsWith('/uploads/') || pathnameWithSearch.startsWith('uploads/')) {
    throw new Error('보호 파일은 인증된 파일 API로만 조회할 수 있습니다.')
  }

  if (pathnameWithSearch.startsWith('/api/v1/')) {
    return pathnameWithSearch
  }

  if (pathnameWithSearch.startsWith('api/v1/')) {
    return `/${pathnameWithSearch}`
  }

  const normalizedPath = pathnameWithSearch.startsWith('/') ? pathnameWithSearch : `/${pathnameWithSearch}`

  return `${API_BASE_URL}${normalizedPath}`
}

export async function fetchProtectedFileObjectUrl(path: string) {
  const headers = new Headers()
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(normalizeProtectedFilePath(path), { headers })

  if (!response.ok) {
    throw new Error('파일을 불러오지 못했습니다.')
  }

  const blob = await response.blob()

  return URL.createObjectURL(blob)
}

export function revokeObjectUrl(url: string) {
  URL.revokeObjectURL(url)
}
