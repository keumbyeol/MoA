
import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, SearchX } from 'lucide-react'

import GuideHero from '../components/guide/GuideHero'
import GuideSearch from '../components/guide/GuideSearch'
import GuideCategoryFilter from '../components/guide/GuideCategoryFilter'
import GuideCard from '../components/guide/GuideCard'
import GuidePagination from '../components/guide/GuidePagination'

import {
  useGuideCategories,
  useGuides,
} from '../hooks/useGuides'

import { guideApi } from '../api/guide'
import { useAuth } from '../hooks/useAuth'
import { message } from '../components/common/Message'

import type { GuideSort } from '../types/guide'

const PAGE_SIZE = 9

export default function GuidePage() {
  const { isAuthenticated } = useAuth()

  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<GuideSort>('latest')

  // 북마크된 가이드 ID
  const [bookmarkedIds, setBookmarkedIds] = useState<
    Set<string>
  >(new Set())

  // 중복 클릭 방지
  const [bookmarkLoadingIds, setBookmarkLoadingIds] =
    useState<Set<string>>(new Set())

  const {
    data: categoryData,
    isPending: isCategoryLoading,
  } = useGuideCategories()

  const {
    data: guideData,
    isPending,
    isFetching,
    isError,
    refetch,
  } = useGuides({
    page,
    size: PAGE_SIZE,
    category: category === 'all' ? undefined : category,
    keyword: keyword || undefined,
    sort,
  })

  // ==========================================
  // 로그인 시 북마크 목록 불러오기
  // ==========================================

  useEffect(() => {
    let cancelled = false

    if (!isAuthenticated) {
      setBookmarkedIds(new Set())
      return
    }

    const loadBookmarks = async () => {
      try {
        const response = await guideApi.getBookmarkIds()

        if (!cancelled) {
          setBookmarkedIds(
            new Set(response.guide_ids),
          )
        }
      } catch (error) {
        console.error('북마크 조회 오류:', error)

        if (!cancelled) {
          setBookmarkedIds(new Set())
        }
      }
    }

    void loadBookmarks()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // ==========================================
  // 북마크 추가 및 해제
  // ==========================================

  const handleBookmarkClick = async (guideId: string) => {
    if (!isAuthenticated) {
      message.warning(
        '북마크 기능은 로그인 후 이용할 수 있습니다.',
      )
      return
    }

    if (bookmarkLoadingIds.has(guideId)) {
      return
    }

    setBookmarkLoadingIds((prev) => {
      const next = new Set(prev)
      next.add(guideId)
      return next
    })

    const wasBookmarked = bookmarkedIds.has(guideId)

    try {
      const nextBookmarked =
        await guideApi.toggleBookmark(
          guideId,
          wasBookmarked,
        )

      setBookmarkedIds((prev) => {
        const next = new Set(prev)

        if (nextBookmarked) {
          next.add(guideId)
        } else {
          next.delete(guideId)
        }

        return next
      })

      message.success(
        nextBookmarked
          ? '북마크에 추가되었습니다.'
          : '북마크가 해제되었습니다.',
      )
    } catch (error) {
      console.error('북마크 변경 오류:', error)

      message.error(
        '북마크 처리에 실패했습니다. 다시 시도해주세요.',
      )
    } finally {
      setBookmarkLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(guideId)
        return next
      })
    }
  }

  // ==========================================
  // 검색 / 카테고리 / 정렬
  // ==========================================

  const handleCategoryChange = (slug: string) => {
    setCategory(slug)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleSortChange = (value: GuideSort) => {
    setSort(value)
    setPage(1)
  }

  const total = guideData?.pagination.total ?? 0
  const guides = guideData?.items ?? []

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-9">
        <GuideHero />

        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen
              size={20}
              className="text-primary-dark"
            />

            <h2 className="text-lg font-bold text-ink">
              어떤 정보가 궁금하신가요?
            </h2>
          </div>

          <GuideSearch
            keyword={keyword}
            onSearch={handleSearch}
          />

          {isCategoryLoading ? (
            <div className="py-5 text-center text-sm text-ink-muted">
              카테고리를 불러오는 중입니다.
            </div>
          ) : (
            <GuideCategoryFilter
              categories={categoryData?.categories ?? []}
              selectedCategory={category}
              onSelect={handleCategoryChange}
            />
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink">
                금융정보 모아보기
              </h2>

              <p className="mt-1 text-xs text-ink-secondary">
                총 {total.toLocaleString('ko-KR')}개의 가이드
              </p>
            </div>

            <div className="relative">
              <label
                htmlFor="guide-sort"
                className="sr-only"
              >
                가이드 정렬
              </label>

              <select
                id="guide-sort"
                value={sort}
                onChange={(event) =>
                  handleSortChange(
                    event.target.value as GuideSort,
                  )
                }
                className="appearance-none rounded-xl border border-line bg-surface py-2.5 pl-4 pr-10 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="title">가나다순</option>
              </select>

              <ChevronDown
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary"
              />
            </div>
          </div>

          {isPending ? (
            <div
              role="status"
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-card bg-surface-muted"
                />
              ))}

              <span className="sr-only">
                가이드를 불러오는 중입니다.
              </span>
            </div>
          ) : isError ? (
            <div className="rounded-card border border-line bg-surface px-6 py-16 text-center">
              <p className="text-sm text-ink-secondary">
                금융정보를 불러오지 못했습니다.
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-full bg-primary-100 px-5 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-200"
              >
                다시 시도
              </button>
            </div>
          ) : guides.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-card border border-line bg-surface px-6 py-20 text-center">
              <SearchX
                size={40}
                strokeWidth={1.5}
                className="text-primary-dark"
              />

              <h3 className="mt-5 text-base font-bold text-ink">
                {keyword || category !== 'all'
                  ? '검색 결과가 없습니다.'
                  : '아직 등록된 금융정보가 없습니다.'}
              </h3>

              <p className="mt-2 text-sm text-ink-secondary">
                {keyword || category !== 'all'
                  ? '다른 검색어나 카테고리로 다시 확인해 주세요.'
                  : '새로운 금융정보가 등록되면 이곳에서 확인할 수 있습니다.'}
              </p>

              {(keyword || category !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setCategory('all')
                    setPage(1)
                  }}
                  className="mt-5 rounded-full bg-primary-100 px-5 py-2 text-sm font-semibold text-primary-800"
                >
                  전체 가이드 보기
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                aria-busy={isFetching}
                className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
                  isFetching ? 'opacity-60' : ''
                }`}
              >
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    isBookmarked={bookmarkedIds.has(guide.id)}
                    onBookmarkClick={handleBookmarkClick}
                  />
                ))}
              </div>

              <GuidePagination
                page={guideData.pagination.page}
                totalPages={guideData.pagination.total_pages}
                onPageChange={(nextPage) => {
                  setPage(nextPage)

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                }}
              />
            </>
          )}
        </section>
      </div>
    </main>
  )
}
