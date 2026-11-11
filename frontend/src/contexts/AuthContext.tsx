
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  authApi,
  type LoginRequest,
  type SignupRequest,
  type User,
} from '../api/auth'

import { tokenStorage } from '../api/client'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<User>
  signup: (data: SignupRequest) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

export const AuthContext = createContext<AuthContextValue | null>(
  null,
)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null)
      return null
    }

    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
      return currentUser
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      if (!tokenStorage.getAccessToken()) {
        if (active) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await authApi.me()

        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (data: LoginRequest): Promise<User> => {
      const tokens = await authApi.login(data)

      tokenStorage.setTokens(
        tokens.access_token,
        tokens.refresh_token,
      )

      try {
        const currentUser = await authApi.me()
        setUser(currentUser)
        return currentUser
      } catch (error) {
        tokenStorage.clearTokens()
        setUser(null)
        throw error
      }
    },
    [],
  )

  const signup = useCallback(
    async (data: SignupRequest): Promise<User> => {
      return authApi.signup(data)
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken()

    try {
      if (refreshToken && tokenStorage.getAccessToken()) {
        await authApi.logout(refreshToken)
      }
    } finally {
      tokenStorage.clearTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, signup, logout, refreshUser],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
