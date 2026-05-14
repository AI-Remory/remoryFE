const DEFAULT_API_BASE_URL = '/api/v1'
const API_VERSION_PREFIX = '/api/v1'
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i

export function normalizeApiBaseUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.trim() || DEFAULT_API_BASE_URL
  let normalizedBase = trimmedBaseUrl

  if (ABSOLUTE_HTTP_URL_PATTERN.test(trimmedBaseUrl)) {
    try {
      const url = new URL(trimmedBaseUrl)
      normalizedBase = `${url.origin}${url.pathname === '/' ? '' : url.pathname}`
    } catch {
      normalizedBase = DEFAULT_API_BASE_URL
    }
  } else if (!normalizedBase.startsWith('/')) {
    normalizedBase = `/${normalizedBase}`
  }

  normalizedBase = normalizedBase.replace(/\/+$/, '')

  return normalizedBase.endsWith(API_VERSION_PREFIX) ? normalizedBase : `${normalizedBase}${API_VERSION_PREFIX}`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)

export const ACCESS_TOKEN_KEY = 'remory_access_token'
export const REFRESH_TOKEN_KEY = 'remory_refresh_token'

type ApiErrorDetailItem = string | { msg?: string; message?: string; loc?: unknown; type?: string }
type ApiErrorDetail = ApiErrorDetailItem | ApiErrorDetailItem[] | null

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  headers?: HeadersInit
}

export class ApiError extends Error {
  status: number
  detail: ApiErrorDetail

  constructor(message: string, status: number, detail: ApiErrorDetail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function redirectToAuth() {
  if (window.location.pathname !== '/auth') {
    window.location.href = '/auth'
  }
}

function stripApiVersionPrefix(path: string) {
  if (path === API_VERSION_PREFIX) {
    return ''
  }

  if (path.startsWith(`${API_VERSION_PREFIX}/`) || path.startsWith(`${API_VERSION_PREFIX}?`)) {
    return path.slice(API_VERSION_PREFIX.length)
  }

  return path
}

export function resolveApiUrl(path: string) {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    return API_BASE_URL
  }

  if (ABSOLUTE_HTTP_URL_PATTERN.test(trimmedPath)) {
    return trimmedPath
  }

  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`
  const apiPath = stripApiVersionPrefix(normalizedPath)

  return `${API_BASE_URL}${apiPath}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getDetailMessage(detail: ApiErrorDetail) {
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        return item.message ?? item.msg ?? '입력값을 확인해주세요.'
      })
      .join('\n')
  }

  if (detail?.message) {
    return detail.message
  }

  if (detail?.msg) {
    return detail.msg
  }

  return 'API 요청에 실패했습니다.'
}

function getStatusMessage(status: number, detail: ApiErrorDetail) {
  if (status === 401) {
    return '로그인이 필요합니다. 다시 로그인해주세요.'
  }

  if (status === 403) {
    return '권한이 없습니다. 접근 권한을 확인해주세요.'
  }

  if (status === 429) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  }

  return getDetailMessage(detail)
}

function isAuthenticationFailure(status: number, detail: ApiErrorDetail) {
  if (status === 401) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const message = getDetailMessage(detail).toLowerCase()

  return (
    message.includes('not authenticated') ||
    message.includes('could not validate') ||
    message.includes('credential') ||
    message.includes('token')
  )
}

function extractErrorDetail(parsed: unknown): ApiErrorDetail {
  if (typeof parsed === 'string') {
    return parsed
  }

  if (!isRecord(parsed)) {
    return null
  }

  const detail = parsed.detail

  if (typeof detail === 'string' || Array.isArray(detail)) {
    return detail as ApiErrorDetail
  }

  if (isRecord(detail)) {
    return detail as ApiErrorDetail
  }

  return null
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return undefined
    }
  }

  const text = await response.text()
  return text || undefined
}

function buildRequestInit(options: RequestOptions): RequestInit {
  const headers = new Headers(options.headers)
  const method = options.method ?? 'GET'

  if (options.auth !== false) {
    const accessToken = getAccessToken()

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  let body: BodyInit | undefined

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body
    } else {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.body)
    }
  }

  return {
    method,
    headers,
    body,
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(resolveApiUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      return false
    }

    const parsed = await parseResponse(response)

    if (!isRecord(parsed) || typeof parsed.access_token !== 'string') {
      return false
    }

    const nextRefreshToken = typeof parsed.refresh_token === 'string' ? parsed.refresh_token : refreshToken
    setTokens(parsed.access_token, nextRefreshToken)

    return true
  } catch {
    return false
  }
}

async function refreshAccessTokenOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  retryOnUnauthorized = true,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl(path), buildRequestInit(options))
  } catch {
    throw new ApiError('백엔드 서버에 연결할 수 없습니다. 서버 실행 상태와 API 주소를 확인해주세요.', 0, null)
  }

  const parsed = await parseResponse(response)

  if (response.ok) {
    return parsed as T
  }

  const detail = extractErrorDetail(parsed)

  if (isAuthenticationFailure(response.status, detail) && options.auth !== false && retryOnUnauthorized && path !== '/auth/refresh-token') {
    const refreshed = await refreshAccessTokenOnce()

    if (refreshed) {
      return apiRequest<T>(path, options, false)
    }

    clearTokens()
    redirectToAuth()
  }

  throw new ApiError(getStatusMessage(response.status, detail), response.status, detail)
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
