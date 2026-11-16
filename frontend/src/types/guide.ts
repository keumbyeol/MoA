
export interface GuideCategory {
  id: number
  slug: string
  name: string
}

export interface GuideCategoryWithCount extends GuideCategory {
  count: number
}

export interface GuideCategoriesResponse {
  total: number
  categories: GuideCategoryWithCount[]
}

export interface Guide {
  id: number
  slug: string
  title: string
  summary: string
  category: GuideCategory
  audience: string | null
  published_at: string | null
  reviewed_at: string | null
  updated_at: string
}

export interface GuideReference {
  id: number
  type: string
  title: string
  url: string
  accessed_at: string
  effective_on: string | null
}

export interface GuideDetail extends Guide {
  body: string
  references: GuideReference[]
}

export type GuideSort = 'latest' | 'oldest' | 'title'

export interface GuideListParams {
  page?: number
  size?: number
  category?: string
  keyword?: string
  sort?: GuideSort
}

export interface GuidePagination {
  page: number
  size: number
  total: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface GuideListResponse {
  items: Guide[]
  pagination: GuidePagination
}
