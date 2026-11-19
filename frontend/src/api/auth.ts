
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

  // 필수 약관 동의
  terms_agreed: boolean
  privacy_agreed: boolean
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

// 회원 정보 수정 요청
export interface UpdateUserRequest {
  nickname?: string
  user_type?: UserType
}

// 비밀번호 변경 요청
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export const authApi = {
  // 회원가입
  async signup(data: SignupRequest): Promise<User> {
    const response = await apiClient.post<User>(
      '/api/auth/signup',
      data,
    )

    return response.data
  },

  // 로그인
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      '/api/auth/login',
      data,
    )

    return response.data
  },

  // 내 정보 조회
  async me(): Promise<User> {
    const response = await apiClient.get<User>(
      '/api/auth/me',
    )

    return response.data
  },

  // 내 정보 수정
  async updateMe(
    data: UpdateUserRequest,
  ): Promise<User> {
    const response = await apiClient.patch<User>(
      '/api/auth/me',
      data,
    )

    return response.data
  },

  // 비밀번호 변경
  async changePassword(
    data: ChangePasswordRequest,
  ): Promise<MessageResponse> {
    const response = await apiClient.patch<MessageResponse>(
      '/api/auth/me/password',
      data,
    )

    return response.data
  },

  // 토큰 갱신
  async refresh(
    refreshToken: string,
  ): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(
      '/api/auth/refresh',
      {
        refresh_token: refreshToken,
      },
    )

    return response.data
  },

  // 로그아웃
  async logout(
    refreshToken: string,
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      '/api/auth/logout',
      {
        refresh_token: refreshToken,
      },
    )

    return response.data
  },
}
