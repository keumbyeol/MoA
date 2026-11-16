
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface GuidePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function GuidePagination({
  page,
  totalPages,
  onPageChange,
}: GuidePaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const getVisiblePages = () => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    const adjustedStart = Math.max(1, end - 4)

    for (let current = adjustedStart; current <= end; current++) {
      pages.push(current)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav
      aria-label="가이드 페이지 이동"
      className="flex items-center justify-center gap-2 py-5"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={17} />
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          aria-label={`${pageNumber}페이지`}
          aria-current={
            pageNumber === page ? 'page' : undefined
          }
          className={[
            'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
            pageNumber === page
              ? 'bg-primary-200 font-bold text-primary-800'
              : 'text-ink-secondary hover:bg-primary-50',
          ].join(' ')}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  )
}
