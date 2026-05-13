export const ACCESS_TOKEN_KEY = 'remory_access_token'
export const REFRESH_TOKEN_KEY = 'remory_refresh_token'

type ApiErrorDetailItem = string | { msg?: string; message?: string }
type ApiErrorDetail = ApiErrorDetailItem | ApiErrorDetailItem[] | Record<string, unknown> | null

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

function trimTrailingSlashes(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function getEnvValue(name: 'VITE_API_BASE_URL' | 'VITE_WS_BASE_URL') {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(`${name} is required. Check .env.local or deployment environment variables.`)
  }

  return trimTrailingSlashes(value)
}

function normalizeWebSocketBaseUrl(baseUrl: string) {
  if (/^wss?:\/\//i.test(baseUrl)) {
    return baseUrl
  }

  if (typeof window === 'undefined') {
    return baseUrl
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const path = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`

  return `${protocol}//${window.location.host}${path}`
}

export const API_BASE_URL = getEnvValue('VITE_API_BASE_URL')
export const WS_BASE_URL = normalizeWebSocketBaseUrl(getEnvValue('VITE_WS_BASE_URL'))

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

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${API_BASE_URL}${normalizedPath}`
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

  if (isRecord(detail)) {
    if (typeof detail.message === 'string') {
      return detail.message
    }

    if (typeof detail.msg === 'string') {
      return detail.msg
    }
  }

  return null
}

function getStatusMessage(status: number) {
  switch (status) {
    case 401:
      return '로그인이 필요합니다.'
    case 403:
      return '요청 권한이 없습니다.'
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.'
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    default:
      return 'API 요청에 실패했습니다.'
  }
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || undefined
}

function getErrorDetail(parsed: unknown): ApiErrorDetail {
  if (typeof parsed === 'string') {
    return parsed
  }

  if (!isRecord(parsed)) {
    return null
  }

  return (parsed.detail as ApiErrorDetail | undefined) ?? parsed
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body,
    })
  } catch {
    throw new ApiError('백엔드 서버에 연결할 수 없습니다. 서버 상태와 API 주소를 확인해주세요.', 0, null)
  }

  const parsed = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens()
    }

    const detail = getErrorDetail(parsed)
    throw new ApiError(getDetailMessage(detail) ?? getStatusMessage(response.status), response.status, detail)
  }

  return parsed as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
