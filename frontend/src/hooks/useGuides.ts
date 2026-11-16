
import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query'

import { guideApi } from '../api/guide'

import type {
  GuideListParams,
} from '../types/guide'


// Query Key 관리
export const guideQueryKeys = {
  all: ['guides'] as const,

  categories: () =>
    [...guideQueryKeys.all, 'categories'] as const,

  lists: () =>
    [...guideQueryKeys.all, 'list'] as const,

  list: (params: GuideListParams) =>
    [...guideQueryKeys.lists(), params] as const,

  details: () =>
    [...guideQueryKeys.all, 'detail'] as const,

  detail: (guideId: number) =>
    [...guideQueryKeys.details(), guideId] as const,
}


// 카테고리 조회
export function useGuideCategories() {
  return useQuery({
    queryKey: guideQueryKeys.categories(),
    queryFn: () => guideApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  })
}


// 가이드 목록 조회
export function useGuides(params: GuideListParams = {}) {
  return useQuery({
    queryKey: guideQueryKeys.list(params),
    queryFn: () => guideApi.getGuides(params),

    // 페이지 변경 시 이전 데이터 유지
    placeholderData: keepPreviousData,

    staleTime: 60 * 1000,
  })
}


// 가이드 상세 조회
export function useGuideDetail(guideId: number) {
  return useQuery({
    queryKey: guideQueryKeys.detail(guideId),
    queryFn: () => guideApi.getGuideDetail(guideId),
    enabled: Number.isInteger(guideId) && guideId > 0,
    staleTime: 60 * 1000,
  })
}
