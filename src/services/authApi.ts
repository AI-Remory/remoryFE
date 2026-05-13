import { apiClient, clearTokens, getRefreshToken, setTokens } from '../lib/apiClient'
import type { AuthResponse, User } from '../types/api'

type RegisterPayload = {
  email: string
  nickname: string
  password: string
}

type LoginPayload = {
  email: string
  password: string
}

function persistAuthResponse(response: AuthResponse) {
  setTokens(response.access_token, response.refresh_token)
  return response
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload, { auth: false })
    return persistAuthResponse(response)
  },

  async login(payload: LoginPayload) {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload, { auth: false })
    return persistAuthResponse(response)
  },

  me() {
    return apiClient.get<User>('/auth/me')
  },

  async refreshToken() {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      throw new Error('저장된 refresh token이 없습니다.')
    }

    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh-token',
      { refresh_token: refreshToken },
      { auth: false },
    )

    return persistAuthResponse(response)
  },

  async logout() {
    const refreshToken = getRefreshToken()

    try {
      if (refreshToken) {
        await apiClient.post<void>('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Logout must clear local auth state even if the server-side revoke fails.
    } finally {
      clearTokens()
      window.location.href = '/auth'
    }
  },
}
