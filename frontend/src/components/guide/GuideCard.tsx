
import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Guide } from '../../types/guide'

interface GuideCardProps {
  guide: Guide
  isBookmarked?: boolean
  onBookmarkClick?: (guideId: number) => void
}

const categoryStyles: Record<
  string,
  { badge: string; image: string }
> = {
  'salary-pension': {
    badge: 'bg-primary-100 text-primary-800',
    image: '/images/mascot/moa_cha_coin.png',
  },
  'labor-allowance': {
    badge: 'bg-accent-pink/40 text-ink',
    image: '/images/mascot/moa_cha_book2.png',
  },
  tax: {
    badge: 'bg-info-soft text-ink',
    image: '/images/mascot/moa_cha_coin.png',
  },
  'social-insurance': {
    badge: 'bg-info-soft text-ink',
    image: '/images/mascot/moa_cha_book1.png',
  },
  'government-support': {
    badge: 'bg-warning-soft text-ink',
    image: '/images/mascot/moa_cha_coin.png',
  },
  other: {
    badge: 'bg-surface-muted text-ink-secondary',
    image: '/images/mascot/moa_cha_book2.png',
  },
}

export default function GuideCard({
  guide,
  isBookmarked = false,
  onBookmarkClick,
}: GuideCardProps) {
  const style = categoryStyles[guide.category.slug] ?? {
    badge: 'bg-surface-muted text-ink-secondary',
    image: '/images/mascot/moa_cha_book1.png',
  }

  return (
    <article className="group relative flex min-h-52 flex-col overflow-hidden rounded-card border border-line bg-surface p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card-hover">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-1 text-2xs font-semibold ${style.badge}`}
        >
          {guide.category.name}
        </span>

        <button
          type="button"
          disabled={!onBookmarkClick}
          onClick={() => onBookmarkClick?.(guide.id)}
          aria-label={
            isBookmarked ? '북마크 해제' : '북마크 추가'
          }
          title={
            onBookmarkClick
              ? '북마크'
              : '북마크 기능은 준비 중입니다.'
          }
          className="relative z-10 rounded-md p-1 text-ink-muted transition-colors hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Bookmark
            size={17}
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <Link
        to={`/guides/${guide.id}`}
        className="relative flex flex-1 flex-col"
      >
        <h3 className="max-w-[90%] text-base font-bold leading-6 text-ink group-hover:text-primary-800">
          {guide.title}
        </h3>

        <p className="mt-2 line-clamp-3 max-w-[88%] text-xs leading-5 text-ink-secondary">
          {guide.summary}
        </p>

        <img
          src={style.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 object-contain"
        />
      </Link>
    </article>
  )
}
