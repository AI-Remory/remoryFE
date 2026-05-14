import {
  apiClient,
  clearTokens,
  getRefreshToken,
  setTokens,
} from './apiClient'
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
  UserRole,
  UserResponse,
} from '../types/auth'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeUserResponse(raw: unknown): UserResponse {
  if (!isRecord(raw)) {
    throw new Error('Invalid /auth/me response shape.')
  }

  const candidate = isRecord(raw.user) ? raw.user : raw
  const rawRole = candidate.role
  const normalizedRole: UserRole = String(rawRole).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'

  return {
    ...(candidate as Omit<UserResponse, 'role'>),
    role: normalizedRole,
  }
}

function normalizeAuthResponse(raw: unknown): AuthResponse {
  if (!isRecord(raw)) {
    throw new Error('Invalid /auth/login response shape.')
  }

  const accessToken = typeof raw.access_token === 'string' ? raw.access_token : null
  if (!accessToken) {
    throw new Error('Login response does not include access_token.')
  }

  const refreshToken = typeof raw.refresh_token === 'string' ? raw.refresh_token : null
  const tokenType = typeof raw.token_type === 'string' ? raw.token_type : 'bearer'
  const user = normalizeUserResponse(raw.user ?? raw)

  const normalized: AuthResponse = {
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
    token_type: tokenType,
    user,
  }

  setTokens(accessToken, refreshToken)
  return normalized
}

function persistTokenResponse(response: TokenResponse) {
  setTokens(response.access_token, response.refresh_token)
  return response
}

export const authService = {
  async register(payload: RegisterRequest) {
    const response = await apiClient.post<unknown>('/auth/register', payload, { auth: false })
    return normalizeAuthResponse(response)
  },

  async login(payload: LoginRequest) {
    const response = await apiClient.post<unknown>('/auth/login', payload, { auth: false })
    return normalizeAuthResponse(response)
  },

  async me() {
    const response = await apiClient.get<unknown>('/auth/me')
    return normalizeUserResponse(response)
  },

  async refreshToken(payload?: RefreshTokenRequest) {
    const refresh_token = payload?.refresh_token ?? getRefreshToken()

    if (!refresh_token) {
      throw new Error('Refresh token is missing.')
    }

    const response = await apiClient.post<TokenResponse>('/auth/refresh-token', { refresh_token }, { auth: false })
    return persistTokenResponse(response)
  },

  async logout(payload?: LogoutRequest) {
    const refresh_token = payload?.refresh_token ?? getRefreshToken()

    try {
      if (refresh_token) {
        await apiClient.post<MessageResponse>('/auth/logout', { refresh_token }, { auth: false })
      }
    } catch {
      // Local logout must still complete if the server-side refresh token is already invalid.
    } finally {
      clearTokens()
    }
  },

  clearSession() {
    clearTokens()
  },
}
