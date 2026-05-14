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
      return '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
    case 400:
      return '요청 내용을 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '권한이 없거나 필요한 조건이 아직 충족되지 않았어요.'
    case 404:
      return '요청한 데이터를 찾을 수 없어요.'
    case 429:
      return '요청이 많아요. 잠시 후 다시 시도해 주세요.'
    case 500:
      return '서버에서 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
    default:
      return '요청 처리 중 문제가 발생했어요.'
  }
}

function getFriendlyDetailMessage(message: string, status: number) {
  const normalized = message.toLowerCase()

  if (status === 401 || /login required|not authenticated|invalid token|token expired|unauthorized/.test(normalized)) {
    return '로그인이 필요해요. 다시 로그인해 주세요.'
  }

  if (status === 403 || /forbidden|permission denied/.test(normalized)) {
    return '권한이 없거나 필요한 조건이 아직 충족되지 않았어요.'
  }

  if (/admin/.test(normalized) && /(required|only|forbidden|permission)/.test(normalized)) {
    return '관리자 권한이 필요해요.'
  }

  if (/verification/.test(normalized) && /(approval|required|approve)/.test(normalized)) {
    return '관계 입증 승인 후 이용할 수 있어요.'
  }

  if (/consent/.test(normalized) && /(required|missing)/.test(normalized)) {
    return '필수 동의를 먼저 완료해 주세요.'
  }

  if (/(photo|image|voice|audio)/.test(normalized) && /(required|insufficient|not enough|missing)/.test(normalized)) {
    return '사진 또는 음성 자료를 먼저 준비해 주세요.'
  }

  if (/persona/.test(normalized) && /(not ready|not available|not prepared|not found)/.test(normalized)) {
    return '페르소나가 아직 준비되지 않았어요.'
  }

  if (/(invalid file|unsupported|mime|file type)/.test(normalized)) {
    return '지원하지 않는 파일 형식이에요. 다른 파일을 올려 주세요.'
  }

  if (/(file too large|too large|max size|size exceeds)/.test(normalized)) {
    return '파일 크기가 너무 커요. 더 작은 파일을 올려 주세요.'
  }

  if (status === 404 || /(not found|resource missing|does not exist)/.test(normalized)) {
    return '요청한 데이터를 찾을 수 없어요.'
  }

  return message
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
    const detailMessage = getDetailMessage(detail)
    const message = detailMessage
      ? getFriendlyDetailMessage(detailMessage, response.status)
      : getStatusMessage(response.status)
    throw new ApiError(message, response.status, detail)
  }

  return parsed as T
}

export async function apiDownload(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<Blob> {
  const headers = new Headers(options.headers)
  const method = options.method ?? 'GET'

  if (options.auth !== false) {
    const accessToken = getAccessToken()

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), { method, headers })
  } catch {
    throw new ApiError(getStatusMessage(0), 0, null)
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens()
    }

    const parsed = await parseResponse(response)
    const detail = getErrorDetail(parsed)
    const detailMessage = getDetailMessage(detail)
    const message = detailMessage
      ? getFriendlyDetailMessage(detailMessage, response.status)
      : getStatusMessage(response.status)
    throw new ApiError(message, response.status, detail)
  }

  return response.blob()
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
  download: (path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiDownload(path, { ...options, method: 'GET' }),
}
