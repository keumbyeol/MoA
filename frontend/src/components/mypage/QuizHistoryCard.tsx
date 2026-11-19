import { ChevronRight, Trophy } from 'lucide-react'

export interface MyPageQuizItem {
  id: number
  title: string
  difficulty?: string
  score?: number | null
  maxScore?: number | null
  createdAt: string
}

interface QuizHistoryCardProps {
  records: MyPageQuizItem[]
  onViewAll?: () => void
  onSelect?: (attemptId: number) => void
  isLoading?: boolean
}

const DIFFICULTY_LABELS: Record<string, string> = { EASY: '초급', MEDIUM: '중급', HARD: '고급', easy: '초급', medium: '중급', hard: '고급' }

export default function QuizHistoryCard({ records, onViewAll, onSelect, isLoading = false }: QuizHistoryCardProps) {
  const recent = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink"><Trophy size={19} className="text-primary-dark" />퀴즈 기록</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className="inline-flex items-center text-xs font-semibold text-ink-secondary hover:text-primary-dark">전체 보기 <ChevronRight size={15} /></button>}
      </div>
      {isLoading ? <p className="py-8 text-center text-sm text-ink-muted">퀴즈 기록을 불러오는 중입니다.</p> : recent.length === 0 ? <p className="py-8 text-center text-sm text-ink-muted">참여한 퀴즈 기록이 없습니다.</p> : (
        <ul className="divide-y divide-line">
          {recent.map((record) => (
            <li key={record.id}>
              <button type="button" disabled={!onSelect} onClick={() => onSelect?.(record.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left enabled:hover:bg-primary-50">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-ink">{record.title}</p>{record.difficulty && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] text-primary-800">{DIFFICULTY_LABELS[record.difficulty] ?? record.difficulty}</span>}</div><p className="mt-1 text-xs text-ink-muted">{record.createdAt.slice(0, 10).replaceAll('-', '.')}</p></div>
                {record.score != null && <span className="shrink-0 text-sm font-bold text-primary-800">{record.score}{record.maxScore != null ? ` / ${record.maxScore}` : '점'}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
