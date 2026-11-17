
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface QuizProgressProps {
  currentIndex: number
  totalQuestions: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  submitting?: boolean
  canProceed?: boolean
}

export default function QuizProgress({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  submitting = false,
  canProceed = true,
}: QuizProgressProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalQuestions - 1

  const progress =
    totalQuestions > 0
      ? ((currentIndex + 1) / totalQuestions) * 100
      : 0

  return (
    <div className="w-full">
      {/* 상단 진행률 */}
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: '#edf0eb' }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor:
                'var(--color-primary-500, #83b940)',
            }}
          />
        </div>

        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            backgroundColor:
              'var(--color-primary-50, #f3faeb)',
            color:
              'var(--color-primary-600, #568b30)',
          }}
        >
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* 하단 이동 버튼 */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          disabled={isFirst || submitting}
          onClick={onPrevious}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor:
              'var(--color-primary-400, #91c94e)',
            color:
              'var(--color-primary-600, #568b30)',
          }}
        >
          <ArrowLeft size={16} />
          이전 문제
        </button>

        <button
          type="button"
          disabled={!canProceed || submitting}
          onClick={isLast ? onSubmit : onNext}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor:
              'var(--color-primary-500, #83b940)',
          }}
        >
          {submitting
            ? '제출 중...'
            : isLast
              ? '제출하기'
              : '다음 문제'}

          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
