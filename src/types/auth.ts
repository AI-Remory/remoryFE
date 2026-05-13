export type UserResponse = {
  created_at: string
  updated_at: string
  id: number
  email: string
  nickname: string
}

export type RegisterRequest = {
  email: string
  nickname: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
  user: UserResponse
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
}

export type RefreshTokenRequest = {
  refresh_token: string
}

export type LogoutRequest = {
  refresh_token: string
}

export type MessageResponse = {
  message: string
}
