
import { ArrowRight, BookOpen, Sprout } from 'lucide-react'

import type {
  QuizDifficulty,
  QuizLevel,
} from '../../types/quiz'

interface QuizLevelSelectorProps {
  levels: QuizLevel[]
  selectedDifficulty: QuizDifficulty | null
  onSelect: (difficulty: QuizDifficulty) => void
  disabled?: boolean
  loading?: boolean
}

const LEVELS = [
  {
    difficulty: 1 as const,
    name: '초급',
    label: '입문',
    description: '금융이 처음이라면 기본 개념부터 차근차근',
    background: 'var(--color-primary-50, #f3faeb)',
    border: 'var(--color-primary-400, #91c94e)',
    icon: '🌱',
  },
  {
    difficulty: 2 as const,
    name: '중급',
    label: '기본',
    description: '실생활에 필요한 금융 지식으로 한 단계 업!',
    background: '#fff9e9',
    border: '#e9bc4b',
    icon: '🌼',
  },
  {
    difficulty: 3 as const,
    name: '고급',
    label: '심화',
    description: '조금 더 깊이 있는 금융 지식에 도전!',
    background: '#f6f3fb',
    border: '#b5a3d8',
    icon: '🍀',
  },
]

export default function QuizLevelSelector({
  levels,
  selectedDifficulty,
  onSelect,
  disabled = false,
  loading = false,
}: QuizLevelSelectorProps) {
  return (
    <aside className="w-full">
      {/* 상단 소개 카드 */}
      <div
        className="rounded-2xl p-6"
        style={{
          background:
            'var(--color-primary-50, #f3faeb)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <BookOpen
            size={28}
            style={{
              color: 'var(--color-primary-600, #568b30)',
            }}
          />
          <Sprout
            size={34}
            style={{
              color: 'var(--color-primary-500, #83b940)',
            }}
          />
        </div>

        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-ink, #253424)' }}
        >
          금융 지식 퀴즈
        </h2>

        <p
          className="mt-2 text-sm leading-6"
          style={{
            color: 'var(--color-ink-secondary, #69736a)',
          }}
        >
          퀴즈로 금융 상식을
          <br />
          쉽고 재미있게 배워보세요!
        </p>
      </div>

      {/* 난이도 선택 */}
      <div className="mt-8">
        <h3
          className="text-base font-bold"
          style={{ color: 'var(--color-ink, #253424)' }}
        >
          난이도 선택
        </h3>

        <p
          className="mt-1 text-xs"
          style={{
            color: 'var(--color-ink-secondary, #69736a)',
          }}
        >
          내 수준에 맞는 난이도로 도전해 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {LEVELS.map((level) => {
          const levelInfo = levels.find(
            (item) => item.difficulty === level.difficulty,
          )

          const count = levelInfo?.question_count ?? 0
          const available = count >= 10
          const selected =
            selectedDifficulty === level.difficulty

          return (
            <button
              key={level.difficulty}
              type="button"
              disabled={disabled || loading || !available}
              onClick={() => onSelect(level.difficulty)}
              aria-pressed={selected}
              className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: level.background,
                borderColor: selected
                  ? level.border
                  : 'transparent',
                borderWidth: selected ? 2 : 1,
              }}
            >
              <span className="text-3xl" aria-hidden="true">
                {level.icon}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {level.name}
                  </span>

                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: '#ffffffaa',
                    }}
                  >
                    {level.label}
                  </span>
                </div>

                <p
                  className="mt-1 text-xs leading-5"
                  style={{
                    color:
                      'var(--color-ink-secondary, #69736a)',
                  }}
                >
                  {level.description}
                </p>

                {!loading && (
                  <p
                    className="mt-1 text-[11px]"
                    style={{
                      color:
                        'var(--color-ink-secondary, #69736a)',
                    }}
                  >
                    {available
                      ? `등록된 문제 ${count}개`
                      : '준비 중'}
                  </p>
                )}
              </div>

              <ArrowRight size={17} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
