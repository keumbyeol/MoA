
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Trophy,
} from 'lucide-react'

import type { QuizSubmitResponse } from '../../types/quiz'

interface QuizResultProps {
  result: QuizSubmitResponse
  onShowExplanation: () => void
  onRetry: () => void
  onBackToLevels: () => void
  retrying?: boolean
}

const LEVEL_NAMES: Record<number, string> = {
  1: '초급',
  2: '중급',
  3: '고급',
}

export default function QuizResult({
  result,
  onShowExplanation,
  onRetry,
  onBackToLevels,
  retrying = false,
}: QuizResultProps) {
  const accuracy =
    result.total_questions > 0
      ? Math.round(
          (result.correct_count / result.total_questions) * 100,
        )
      : 0

  const feedback =
    accuracy >= 90
      ? '훌륭해요! 금융 지식을 아주 잘 알고 계시네요.'
      : accuracy >= 70
        ? '잘하셨어요! 조금만 더 공부하면 완벽해질 거예요.'
        : accuracy >= 50
          ? '좋아요! 해설을 보면서 부족한 부분을 채워보세요.'
          : '괜찮아요! 하나씩 배우면서 다시 도전해 보세요.'

  return (
    <section
      className="rounded-2xl border bg-white p-6 sm:p-9"
      style={{
        borderColor: 'var(--color-line, #edf0eb)',
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              'var(--color-primary-50, #f3faeb)',
          }}
        >
          <Trophy
            size={38}
            style={{
              color: 'var(--color-primary-500, #83b940)',
            }}
          />
        </div>

        <span
          className="mt-5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: '#fff7df',
            color: '#95711c',
          }}
        >
          {LEVEL_NAMES[result.difficulty] ?? '금융'} 퀴즈 완료
        </span>

        <h2 className="mt-4 text-2xl font-bold">
          퀴즈를 완료했어요!
        </h2>

        <p
          className="mt-2 text-sm leading-6"
          style={{
            color: 'var(--color-ink-secondary, #69736a)',
          }}
        >
          {feedback}
        </p>

        <div className="mt-7 flex items-baseline gap-2">
          <strong
            className="text-6xl font-bold"
            style={{
              color: 'var(--color-primary-600, #568b30)',
            }}
          >
            {result.score}
          </strong>
          <span
            className="text-lg"
            style={{
              color: 'var(--color-ink-secondary, #69736a)',
            }}
          >
            점
          </span>
        </div>

        <div className="mt-7 grid w-full grid-cols-2 gap-3">
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor:
                'var(--color-primary-50, #f3faeb)',
            }}
          >
            <CheckCircle2
              size={21}
              className="mx-auto"
              style={{ color: '#72b44a' }}
            />
            <p className="mt-2 text-xs text-ink-secondary">
              맞힌 문제
            </p>
            <p className="mt-1 text-xl font-bold">
              {result.correct_count} / {result.total_questions}
            </p>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#fff9e9' }}
          >
            <Trophy
              size={21}
              className="mx-auto"
              style={{ color: '#e3b73d' }}
            />
            <p className="mt-2 text-xs text-ink-secondary">
              정답률
            </p>
            <p className="mt-1 text-xl font-bold">
              {accuracy}%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onShowExplanation}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            backgroundColor:
              'var(--color-primary-500, #83b940)',
          }}
        >
          <BookOpen size={18} />
          문제별 해설 보기
          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            borderColor:
              'var(--color-primary-400, #91c94e)',
            color:
              'var(--color-primary-600, #568b30)',
          }}
        >
          <RotateCcw size={17} />
          {retrying ? '준비 중...' : '같은 난이도 다시 풀기'}
        </button>

        <button
          type="button"
          onClick={onBackToLevels}
          className="mt-4 text-sm font-medium text-ink-secondary hover:underline"
        >
          난이도 선택으로 돌아가기
        </button>
      </div>
    </section>
  )
}
