import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACCESS_TOKEN_KEY, getAccessToken } from '../services/apiClient'
import { authService } from '../services/authService'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../types/auth'

type AuthContextValue = {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<AuthResponse>
  register: (payload: RegisterRequest) => Promise<AuthResponse>
  refreshMe: () => Promise<UserResponse | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return null
    }

    try {
      const currentUser = await authService.me()
      setUser(currentUser)
      return currentUser
    } catch {
      authService.clearSession()
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadSession() {
      const currentUser = await refreshMe()

      if (!ignore && !currentUser) {
        setUser(null)
      }

      if (!ignore) {
        setIsLoading(false)
      }
    }

    loadSession()

    return () => {
      ignore = true
    }
  }, [refreshMe])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === ACCESS_TOKEN_KEY) {
        refreshMe().catch(() => undefined)
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [refreshMe])

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload)
    setUser(response.user)
    return response
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await authService.register(payload)
    setUser(response.user)
    return response
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      isLoading,
      login,
      register,
      refreshMe,
      logout,
    }),
    [isLoading, login, logout, refreshMe, register, user],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
