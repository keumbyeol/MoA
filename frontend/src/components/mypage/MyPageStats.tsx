import { Bookmark, Calculator, MessageCircle, Trophy } from 'lucide-react'

interface MyPageStatsProps {
  wageCount: number
  bookmarkCount: number
  chatCount: number
  quizCount: number
  isLoading?: boolean
}

export default function MyPageStats({ wageCount, bookmarkCount, chatCount, quizCount, isLoading = false }: MyPageStatsProps) {
  const stats = [
    { label: '계산서 내역', value: wageCount, unit: '건', icon: Calculator },
    { label: '북마크', value: bookmarkCount, unit: '개', icon: Bookmark },
    { label: '챗봇 대화', value: chatCount, unit: '건', icon: MessageCircle },
    { label: '퀴즈 참여', value: quizCount, unit: '회', icon: Trophy },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, unit, icon: Icon }) => (
        <div key={label} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-primary-700">
            <Icon size={17} />
            <span className="text-xs font-medium text-ink-secondary">{label}</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-14 animate-pulse rounded-md bg-primary-100" />
          ) : (
            <p className="text-xl font-bold tabular-nums text-ink">
              {value.toLocaleString('ko-KR')}<span className="ml-1 text-xs font-normal text-ink-secondary">{unit}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
