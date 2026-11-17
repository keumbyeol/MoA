import { apiRequest } from './client'

import type {
  GuideCategoriesResponse,
  GuideDetail,
  GuideListParams,
  GuideListResponse,
} from '../types/guide'

const GUIDE_API_PATH = '/api/guides'

export const guideApi = {
  getCategories: (): Promise<GuideCategoriesResponse> =>
    apiRequest<GuideCategoriesResponse>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/categories`,
    }),

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

  getGuideDetail: (
    guideId: string,
  ): Promise<GuideDetail> =>
    apiRequest<GuideDetail>({
      method: 'GET',
      url: `${GUIDE_API_PATH}/${encodeURIComponent(guideId)}`,
    }),
}