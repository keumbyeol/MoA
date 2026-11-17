import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query'

import { guideApi } from '../api/guide'

import type {
  GuideListParams,
} from '../types/guide'

export const guideQueryKeys = {
  all: ['guides'] as const,

  categories: () =>
    ['guides', 'categories'] as const,

  list: (params: GuideListParams) =>
    ['guides', 'list', params] as const,

  detail: (id: string) =>
    ['guides', 'detail', id] as const,
}

export function useGuideCategories() {
  return useQuery({
    queryKey: guideQueryKeys.categories(),
    queryFn: guideApi.getCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuides(
  params: GuideListParams = {},
) {
  return useQuery({
    queryKey: guideQueryKeys.list(params),
    queryFn: () => guideApi.getGuides(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export function useGuideDetail(id: string) {
  return useQuery({
    queryKey: guideQueryKeys.detail(id),
    queryFn: () => guideApi.getGuideDetail(id),
    enabled: /^(topic-[a-z0-9-]+|policy-[0-9]+)$/.test(id),
    staleTime: 60 * 1000,
  })
}