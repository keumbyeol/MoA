import { apiRequest } from './client'

import type {
  GuideCategoriesResponse,
  GuideDetail,
  GuideListParams,
  GuideListResponse,
} from '../types/guide'

const GUIDE_API_PATH = '/api/guides'

export const guideApi = {
  // 카테고리 및 카테고리별 가이드 개수 조회
  getCategories: async (): Promise<GuideCategoriesResponse> => {
    return apiRequest<GuideCategoriesResponse>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/categories`,
    })
  },

  // 금융정보 가이드 목록 조회
  getGuides: async (
    params: GuideListParams = {},
  ): Promise<GuideListResponse> => {
    return apiRequest<GuideListResponse>({
      method: 'GET',
      url: GUIDE_API_PATH,
      params: {
        page: params.page ?? 1,
        size: params.size ?? 9,
        category: params.category || undefined,
        keyword: params.keyword?.trim() || undefined,
        sort: params.sort ?? 'latest',
      },
    })
  },

  // 금융정보 가이드 상세 조회
  getGuideDetail: async (
    guideId: number,
  ): Promise<GuideDetail> => {
    return apiRequest<GuideDetail>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/${guideId}`,
    })
  },
}
