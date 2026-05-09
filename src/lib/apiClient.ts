const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

export const ACCESS_TOKEN_KEY = 'remory_access_token'
export const REFRESH_TOKEN_KEY = 'remory_refresh_token'

type ApiErrorDetail = string | string[] | { msg?: string; message?: string } | null

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

function buildUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedBase}${normalizedPath}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getDetailMessage(detail: ApiErrorDetail) {
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.join('\n')
  }

  if (detail?.message) {
    return detail.message
  }

  if (detail?.msg) {
    return detail.msg
  }

  return 'API 요청에 실패했습니다.'
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

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body,
  })

  const parsed = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens()
    }

    const detail = isRecord(parsed) ? (parsed.detail as ApiErrorDetail | undefined) ?? null : null
    throw new ApiError(getDetailMessage(detail), response.status, detail)
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
