import { ChevronRight, MessageCircle } from 'lucide-react'
import type { ChatConversation } from '../../api/chat'

interface ChatHistoryCardProps {
  conversations: ChatConversation[]
  onViewAll?: () => void
  onSelect?: (conversationId: number) => void
  isLoading?: boolean
}

export default function ChatHistoryCard({ conversations, onViewAll, onSelect, isLoading = false }: ChatHistoryCardProps) {
  const recent = [...conversations].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3)
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink"><MessageCircle size={19} className="text-primary-dark" />챗봇 대화 내역</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className="inline-flex items-center text-xs font-semibold text-ink-secondary hover:text-primary-dark">전체 보기 <ChevronRight size={15} /></button>}
      </div>
      {isLoading ? <p className="py-8 text-center text-sm text-ink-muted">대화 기록을 불러오는 중입니다.</p> : recent.length === 0 ? <p className="py-8 text-center text-sm text-ink-muted">저장된 챗봇 대화가 없습니다.</p> : (
        <ul className="divide-y divide-line">
          {recent.map((conversation) => (
            <li key={conversation.id}>
              <button type="button" disabled={!onSelect} onClick={() => onSelect?.(conversation.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left enabled:hover:bg-primary-50">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{conversation.title || '제목 없는 대화'}</p><p className="mt-1 text-xs text-ink-muted">{conversation.updated_at.slice(0, 10).replaceAll('-', '.')}</p></div>
                {onSelect && <ChevronRight size={16} className="shrink-0 text-ink-muted" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
