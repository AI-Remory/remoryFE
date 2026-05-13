export const ACCESS_TOKEN_KEY = 'remory_access_token'
export const REFRESH_TOKEN_KEY = 'remory_refresh_token'

const DEFAULT_API_BASE_URL = '/api/v1'
const DEFAULT_WS_BASE_URL = '/api/v1'

type ApiErrorDetailItem = string | { msg?: string; message?: string; loc?: unknown }
export type ApiErrorDetail = ApiErrorDetailItem | ApiErrorDetailItem[] | Record<string, unknown> | null

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

function getEnvValue(name: 'VITE_API_BASE_URL' | 'VITE_WS_BASE_URL', defaultValue: string) {
  return trimTrailingSlashes(import.meta.env[name] || defaultValue)
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

export const API_BASE_URL = getEnvValue('VITE_API_BASE_URL', DEFAULT_API_BASE_URL)
export const WS_BASE_URL = normalizeWebSocketBaseUrl(getEnvValue('VITE_WS_BASE_URL', DEFAULT_WS_BASE_URL))

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') {
    return
  }

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

function getDetailMessage(detail: ApiErrorDetail): string | null {
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        return item.message ?? item.msg
      })
      .filter((message): message is string => Boolean(message))

    return messages.length > 0 ? messages.join('\n') : null
  }

  if (isRecord(detail)) {
    const detailRecord = detail as Record<string, unknown>
    const nestedDetail = detailRecord.detail as ApiErrorDetail | undefined

    if (nestedDetail !== undefined && nestedDetail !== detail) {
      const nestedMessage = getDetailMessage(nestedDetail)

      if (nestedMessage) {
        return nestedMessage
      }
    }

    if (typeof detailRecord.message === 'string') {
      return detailRecord.message
    }

    if (typeof detailRecord.msg === 'string') {
      return detailRecord.msg
    }
  }

  return null
}

function getStatusMessage(status: number) {
  switch (status) {
    case 0:
      return 'Unable to connect to the API server. Check the server status and API base URL.'
    case 400:
      return 'The request could not be processed. Please check the submitted values.'
    case 401:
      return 'Authentication is required. Please sign in again.'
    case 403:
      return 'You do not have permission to perform this request.'
    case 404:
      return 'The requested resource could not be found.'
    case 429:
      return 'Too many requests. Please try again later.'
    case 500:
      return 'A server error occurred. Please try again later.'
    default:
      return 'The API request failed.'
  }
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

  try {
    const text = await response.text()
    return text || undefined
  } catch {
    return undefined
  }
}

function getErrorDetail(parsed: unknown): ApiErrorDetail {
  if (typeof parsed === 'string') {
    return parsed
  }

  if (!isRecord(parsed)) {
    return null
  }

  return (parsed.detail as ApiErrorDetail | undefined) ?? (parsed.message as string | undefined) ?? parsed
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
    throw new ApiError(getStatusMessage(0), 0, null)
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
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
