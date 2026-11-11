
import { apiClient } from './client'

export type UserType =
  | 'FIRST_JOB'
  | 'PART_TIME'
  | 'FOREIGN_WORKER'
  | 'RETURNING'
  | 'OTHER'

export interface User {
  id: number
  email: string
  nickname: string
  user_type: UserType
  status: string
  created_at: string
}

export interface SignupRequest {
  email: string
  nickname: string
  password: string
  user_type: UserType
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface MessageResponse {
  message: string
}

export const authApi = {
  async signup(data: SignupRequest): Promise<User> {
    const response = await apiClient.post<User>(
      '/api/auth/signup',
      data,
    )
    return response.data
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      '/api/auth/login',
      data,
    )
    return response.data
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me')
    return response.data
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      '/api/auth/refresh',
      { refresh_token: refreshToken },
    )
    return response.data
  },

  async logout(refreshToken: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      '/api/auth/logout',
      { refresh_token: refreshToken },
    )
    return response.data
  },
}
