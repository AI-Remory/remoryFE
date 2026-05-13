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
  UserResponse,
} from '../types/auth'

function persistAuthResponse(response: AuthResponse) {
  setTokens(response.access_token, response.refresh_token)
  return response
}

function persistTokenResponse(response: TokenResponse) {
  setTokens(response.access_token, response.refresh_token)
  return response
}

export const authService = {
  async register(payload: RegisterRequest) {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload, { auth: false })
    return persistAuthResponse(response)
  },

  async login(payload: LoginRequest) {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload, { auth: false })
    return persistAuthResponse(response)
  },

  me() {
    return apiClient.get<UserResponse>('/auth/me')
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
