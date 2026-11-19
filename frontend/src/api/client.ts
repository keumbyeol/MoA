
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

export const ACCESS_TOKEN_KEY = 'moa_access_token'
export const REFRESH_TOKEN_KEY = 'moa_refresh_token'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==========================================
// 토큰 저장 관리
// ==========================================

export const tokenStorage = {
  getAccessToken: (): string | null =>
    localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null =>
    localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (
    accessToken: string,
    refreshToken: string,
  ): void => {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken,
    )

    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken,
    )
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// ==========================================
// 인증 관련 타입
// ==========================================

interface RetryableRequest
  extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

let refreshPromise: Promise<RefreshResponse> | null = null

// ==========================================
// 요청 인터셉터
// 로그인 토큰 자동 첨부
// ==========================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()

    if (token) {
      config.headers.set(
        'Authorization',
        `Bearer ${token}`,
      )
    }

    return config
  },
  (error: unknown) => Promise.reject(error),
)

// ==========================================
// 응답 인터셉터
// 401 발생 시 토큰 갱신
// ==========================================

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableRequest
      | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/refresh') ||
      originalRequest.url?.includes('/api/auth/logout')
    ) {
      return Promise.reject(error)
    }

    const refreshToken =
      tokenStorage.getRefreshToken()

    if (!refreshToken) {
      tokenStorage.clearTokens()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post<RefreshResponse>(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              refresh_token: refreshToken,
            },
          )
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const tokens = await refreshPromise

      tokenStorage.setTokens(
        tokens.access_token,
        tokens.refresh_token,
      )

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${tokens.access_token}`,
      )

      return apiClient(originalRequest)
    } catch (refreshError) {
      tokenStorage.clearTokens()
      return Promise.reject(refreshError)
    }
  },
)

// ==========================================
// API 오류 메시지 처리
// ==========================================

export function getApiErrorMessage(
  error: unknown,
  fallback = '요청 처리 중 오류가 발생했습니다.',
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (
      Array.isArray(detail) &&
      detail.length > 0
    ) {
      const first = detail[0]

      if (typeof first?.msg === 'string') {
        return first.msg
      }
    }

    if (!error.response) {
      return '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.'
    }
  }

  return fallback
}

// ==========================================
// 공통 API 요청 함수
// ==========================================

export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  const response =
    await apiClient.request<T>(config)

  return response.data
}
