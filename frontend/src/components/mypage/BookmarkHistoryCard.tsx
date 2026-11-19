import { Bookmark, ChevronRight, Star } from 'lucide-react'
import type { GuideBookmark } from '../../api/guide'

interface BookmarkHistoryCardProps {
  bookmarks: GuideBookmark[]
  onViewAll?: () => void
  onSelect?: (guideId: string) => void
  isLoading?: boolean
}

export default function BookmarkHistoryCard({ bookmarks, onViewAll, onSelect, isLoading = false }: BookmarkHistoryCardProps) {
  const recent = [...bookmarks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink"><Bookmark size={19} className="text-primary-dark" />북마크한 정보</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className="inline-flex items-center text-xs font-semibold text-ink-secondary hover:text-primary-dark">전체 보기 <ChevronRight size={15} /></button>}
      </div>
      {isLoading ? <p className="py-8 text-center text-sm text-ink-muted">북마크를 불러오는 중입니다.</p> : recent.length === 0 ? <p className="py-8 text-center text-sm text-ink-muted">북마크한 금융정보가 없습니다.</p> : (
        <ul className="divide-y divide-line">
          {recent.map((bookmark) => (
            <li key={bookmark.id}>
              <button type="button" disabled={!onSelect} onClick={() => onSelect?.(bookmark.guide_id)} className="flex w-full items-center gap-3 py-3 text-left enabled:hover:bg-primary-50">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{bookmark.guide?.title ?? bookmark.guide_id}</p><p className="mt-1 text-xs text-ink-muted">{bookmark.created_at.slice(0, 10).replaceAll('-', '.')}</p></div>
                <Star size={17} className="shrink-0 fill-yellow-300 text-yellow-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
