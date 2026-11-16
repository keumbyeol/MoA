
import { CalendarDays, Share2 } from 'lucide-react'

import type { GuideDetail } from '../../types/guide'

interface GuideDetailHeroProps {
  guide: GuideDetail
}

export default function GuideDetailHero({
  guide,
}: GuideDetailHeroProps) {
  const handleShare = async () => {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: guide.title,
          text: guide.summary,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        window.alert('링크가 복사되었습니다.')
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return
      }

      window.alert('링크를 공유하지 못했습니다.')
    }
  }

  const updatedDate = guide.reviewed_at ?? guide.updated_at

  return (
    <header className="border-b border-line pb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
          {guide.category.name}
        </span>

        <button
          type="button"
          onClick={handleShare}
          aria-label="가이드 공유하기"
          className="rounded-lg border border-line p-2 text-ink-secondary transition-colors hover:border-primary hover:text-primary-dark"
        >
          <Share2 size={17} />
        </button>
      </div>

      <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
        {guide.title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-ink-secondary">
        {guide.summary}
      </p>

      <div className="mt-5 flex items-center gap-2 text-xs text-ink-muted">
        <CalendarDays size={14} />
        <span>
          최종 확인일{' '}
          {new Date(updatedDate).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </header>
  )
}
