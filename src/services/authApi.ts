import { apiClient, clearTokens, setTokens } from '../lib/apiClient'
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

  logout() {
    clearTokens()
    window.location.href = '/auth'
  },
}
