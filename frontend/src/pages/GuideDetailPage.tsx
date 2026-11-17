import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

import GuideDetailHero from '../components/guide/GuideDetailHero'
import GuideDetailContent from '../components/guide/GuideDetailContent'
import GuideChatPanel from '../components/guide/GuideChatPanel'

import { useGuideDetail } from '../hooks/useGuides'

export default function GuideDetailPage() {
  const { guideId = '' } =
    useParams<{ guideId: string }>()

  const isValidId =
    /^(topic-[a-z0-9-]+|policy-[0-9]+)$/.test(guideId)

  const {
    data: guide,
    isPending,
    isError,
    error,
    refetch,
  } = useGuideDetail(guideId)

  if (!isValidId) {
    return (
      <GuideDetailMessage
        title="올바르지 않은 접근입니다."
        description="가이드 주소를 다시 확인해 주세요."
      />
    )
  }

  if (isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          role="status"
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-card bg-surface-muted" />
            <div className="h-36 animate-pulse rounded-card bg-surface-muted" />
            <div className="h-72 animate-pulse rounded-card bg-surface-muted" />
          </div>

          <div className="h-96 animate-pulse rounded-card bg-surface-muted" />

          <span className="sr-only">
            가이드 상세 정보를 불러오는 중입니다.
          </span>
        </div>
      </main>
    )
  }

  if (isError || !guide) {
    const status = (
      error as {
        response?: { status?: number }
      } | null
    )?.response?.status

    return (
      <GuideDetailMessage
        title={
          status === 404
            ? '가이드를 찾을 수 없습니다.'
            : '가이드를 불러오지 못했습니다.'
        }
        description={
          status === 404
            ? '관련 정보가 존재하지 않습니다.'
            : '잠시 후 다시 시도해 주세요.'
        }
        onRetry={
          status === 404
            ? undefined
            : () => void refetch()
        }
      />
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        aria-label="현재 위치"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs text-ink-secondary"
      >
        <Link
          to="/guides"
          className="hover:text-primary-dark"
        >
          금융정보 가이드
        </Link>

        <ChevronRight
          size={14}
          aria-hidden="true"
        />

        <span>{guide.category.name}</span>

        <ChevronRight
          size={14}
          aria-hidden="true"
        />

        <span className="max-w-48 truncate font-semibold text-ink">
          {guide.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 rounded-card border border-line bg-surface p-5 shadow-soft sm:p-8">
          <GuideDetailHero guide={guide} />

          <div className="mt-8">
            <GuideDetailContent guide={guide} />
          </div>

          <div className="mt-10 border-t border-line pt-6">
            <Link
              to="/guides"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-primary hover:text-primary-dark"
            >
              <ArrowLeft size={16} />
              목록으로 돌아가기
            </Link>
          </div>
        </article>

        <div className="min-w-0 space-y-5 lg:sticky lg:top-24">
          <GuideChatPanel guideTitle={guide.title} />

          <div className="rounded-card border border-line bg-primary-50 p-5">
            <div className="flex items-center gap-2">
              <BookOpen
                size={18}
                className="text-primary-dark"
              />

              <h2 className="text-sm font-bold text-ink">
                다른 금융정보도 살펴보세요
              </h2>
            </div>

            <p className="mt-3 text-xs leading-6 text-ink-secondary">
              급여, 세금, 사회보험 등 다양한 금융정보를
              주제별로 확인할 수 있습니다.
            </p>

            <Link
              to="/guides"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-dark hover:underline"
            >
              금융정보 더 보기
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

interface GuideDetailMessageProps {
  title: string
  description: string
  onRetry?: () => void
}

function GuideDetailMessage({
  title,
  description,
  onRetry,
}: GuideDetailMessageProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <AlertCircle
        size={44}
        strokeWidth={1.5}
        className="text-primary-dark"
      />

      <h1 className="mt-5 text-xl font-bold text-ink">
        {title}
      </h1>

      <p className="mt-3 text-sm text-ink-secondary">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink"
          >
            다시 시도
          </button>
        )}

        <Link
          to="/guides"
          className="rounded-full bg-primary-100 px-5 py-2.5 text-sm font-semibold text-primary-800"
        >
          가이드 목록으로
        </Link>
      </div>
    </main>
  )
}