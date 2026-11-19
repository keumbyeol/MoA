import { Calculator, ChevronRight } from 'lucide-react'
import type { WageRecord } from '../../types/wage'

interface WageHistoryCardProps {
  records: WageRecord[]
  onViewAll?: () => void
  onSelect?: (record: WageRecord) => void
  isLoading?: boolean
}

function formatDate(value: string) {
  return value ? value.slice(0, 10).replaceAll('-', '.') : '-'
}

export default function WageHistoryCard({ records, onViewAll, onSelect, isLoading = false }: WageHistoryCardProps) {
  const recent = [...records].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink"><Calculator size={19} className="text-primary-dark" />임금 계산서 내역</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className="inline-flex items-center text-xs font-semibold text-ink-secondary hover:text-primary-dark">전체 보기 <ChevronRight size={15} /></button>}
      </div>
      {isLoading ? <p className="py-8 text-center text-sm text-ink-muted">계산 내역을 불러오는 중입니다.</p> : recent.length === 0 ? <p className="py-8 text-center text-sm text-ink-muted">저장된 임금 계산서가 없습니다.</p> : (
        <ul className="divide-y divide-line">
          {recent.map((record) => (
            <li key={record.id}>
              <button type="button" disabled={!onSelect} onClick={() => onSelect?.(record)} className="flex w-full items-center justify-between gap-3 py-3 text-left enabled:hover:bg-primary-50">
                <div className="min-w-0"><p className="text-sm font-semibold text-ink">{record.target_year}년 {record.target_month}월 임금 계산</p><p className="mt-1 text-xs text-ink-muted">{formatDate(record.created_at)}</p></div>
                <span className="shrink-0 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-800">{record.total_pay.toLocaleString('ko-KR')}원</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
