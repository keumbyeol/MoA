
import { apiRequest } from './client'

import type {
  Guide,
  GuideCategoriesResponse,
  GuideDetail,
  GuideListParams,
  GuideListResponse,
} from '../types/guide'

const GUIDE_API_PATH = '/api/guides'
const BOOKMARK_API_PATH = '/api/bookmarks'

// 북마크 항목
export interface GuideBookmark {
  id: number
  guide_id: string
  guide: Guide | null
  created_at: string
}

// 북마크 목록 응답
export interface GuideBookmarksResponse {
  total: number
  items: GuideBookmark[]
}

// 북마크 개수 응답
export interface GuideBookmarkCountResponse {
  count: number
}

// 북마크된 가이드 ID 목록
export interface GuideBookmarkIdsResponse {
  guide_ids: string[]
}

// 북마크 삭제 응답
export interface GuideBookmarkMessageResponse {
  message: string
}

export const guideApi = {
  // ==========================================
  // 금융 가이드 카테고리
  // ==========================================

  getCategories: (): Promise<GuideCategoriesResponse> =>
    apiRequest<GuideCategoriesResponse>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/categories`,
    }),

  // ==========================================
  // 금융 가이드 목록
  // ==========================================

  getGuides: (
    params: GuideListParams = {},
  ): Promise<GuideListResponse> =>
    apiRequest<GuideListResponse>({
      method: 'GET',
      url: GUIDE_API_PATH,
      params: {
        page: params.page ?? 1,
        size: params.size ?? 9,
        category: params.category || undefined,
        keyword: params.keyword?.trim() || undefined,
        sort: params.sort ?? 'latest',
      },
    }),

  // ==========================================
  // 금융 가이드 상세
  // ==========================================

  getGuideDetail: (
    guideId: string,
  ): Promise<GuideDetail> =>
    apiRequest<GuideDetail>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/${encodeURIComponent(guideId)}`,
    }),

  // ==========================================
  // 북마크 목록 조회
  // GET /api/bookmarks
  // ==========================================

  getBookmarks: (): Promise<GuideBookmarksResponse> =>
    apiRequest<GuideBookmarksResponse>({
      method: 'GET',
      url: BOOKMARK_API_PATH,
    }),

  // ==========================================
  // 북마크 개수 조회
  // GET /api/bookmarks/count
  // ==========================================

  getBookmarkCount: (): Promise<GuideBookmarkCountResponse> =>
    apiRequest<GuideBookmarkCountResponse>({
      method: 'GET',
      url: `${BOOKMARK_API_PATH}/count`,
    }),

  // ==========================================
  // 북마크된 가이드 ID 목록
  // GET /api/bookmarks/ids
  // ==========================================

  getBookmarkIds: (): Promise<GuideBookmarkIdsResponse> =>
    apiRequest<GuideBookmarkIdsResponse>({
      method: 'GET',
      url: `${BOOKMARK_API_PATH}/ids`,
    }),

  // ==========================================
  // 북마크 추가
  // POST /api/bookmarks
  // ==========================================

  addBookmark: (
    guideId: string,
  ): Promise<GuideBookmark> =>
    apiRequest<GuideBookmark>({
      method: 'POST',
      url: BOOKMARK_API_PATH,
      data: {
        guide_id: guideId,
      },
    }),

  // ==========================================
  // 북마크 삭제
  // DELETE /api/bookmarks/{guide_id}
  // ==========================================

  removeBookmark: (
    guideId: string,
  ): Promise<GuideBookmarkMessageResponse> =>
    apiRequest<GuideBookmarkMessageResponse>({
      method: 'DELETE',
      url: `${BOOKMARK_API_PATH}/${encodeURIComponent(guideId)}`,
    }),

  // ==========================================
  // 북마크 토글
  // 현재 상태에 따라 추가 또는 삭제
  // ==========================================

  toggleBookmark: async (
    guideId: string,
    isBookmarked: boolean,
  ): Promise<boolean> => {
    if (isBookmarked) {
      await guideApi.removeBookmark(guideId)
      return false
    }

    await guideApi.addBookmark(guideId)
    return true
  },
}
