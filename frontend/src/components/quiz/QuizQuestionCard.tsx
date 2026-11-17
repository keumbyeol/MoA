
import { Check, CircleHelp, Lightbulb } from 'lucide-react'

import type { QuizQuestion } from '../../types/quiz'

interface QuizQuestionCardProps {
  question: QuizQuestion
  questionNumber: number
  selectedOptionId: number | null
  onSelectOption: (optionId: number) => void
  disabled?: boolean
}

export default function QuizQuestionCard({
  question,
  questionNumber,
  selectedOptionId,
  onSelectOption,
  disabled = false,
}: QuizQuestionCardProps) {
  const isOX = question.question_type === 'OX'

  return (
    <section
      className="rounded-2xl border bg-white p-5 sm:p-7"
      style={{
        borderColor: 'var(--color-line, #edf0eb)',
      }}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: '#fff7df',
            color: '#95711c',
          }}
        >
          {isOX ? 'OX 퀴즈' : '객관식'}
        </span>

        <span
          className="text-xs"
          style={{
            color: 'var(--color-ink-secondary, #69736a)',
          }}
        >
          문제 {questionNumber}
        </span>
      </div>

      <div className="mb-6 flex items-start gap-3">
        <CircleHelp
          size={24}
          className="mt-1 shrink-0"
          style={{
            color: 'var(--color-primary-500, #83b940)',
          }}
        />

        <h2
          className="text-lg font-bold leading-8 sm:text-xl"
          style={{ color: 'var(--color-ink, #253424)' }}
        >
          {question.question_text}
        </h2>
      </div>

      <div
        className={
          isOX
            ? 'grid grid-cols-2 gap-3'
            : 'flex flex-col gap-3'
        }
      >
        {question.options.map((option, index) => {
          const selected = selectedOptionId === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(option.id)}
              aria-pressed={selected}
              className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                isOX ? 'justify-center' : ''
              }`}
              style={{
                borderColor: selected
                  ? 'var(--color-primary-500, #83b940)'
                  : 'var(--color-line-strong, #dfe5dc)',
                backgroundColor: selected
                  ? 'var(--color-primary-50, #f3faeb)'
                  : '#ffffff',
                color: 'var(--color-ink, #253424)',
              }}
            >
              {!isOX && (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                  style={{
                    backgroundColor: selected
                      ? 'var(--color-primary-500, #83b940)'
                      : '#ffffff',
                    borderColor: selected
                      ? 'var(--color-primary-500, #83b940)'
                      : 'var(--color-line-strong, #dfe5dc)',
                    color: selected ? '#ffffff' : '#69736a',
                  }}
                >
                  {selected ? <Check size={14} /> : index + 1}
                </span>
              )}

              <span
                className={
                  isOX
                    ? 'text-center text-2xl font-bold'
                    : 'flex-1 text-sm leading-6'
                }
              >
                {option.option_text}
              </span>
            </button>
          )
        })}
      </div>

      <div
        className="mt-6 flex items-start gap-2 rounded-xl p-4"
        style={{
          backgroundColor: '#fffaf0',
          color: '#856b35',
        }}
      >
        <Lightbulb size={17} className="mt-0.5 shrink-0" />

        <p className="text-xs leading-5">
          {isOX
            ? '문장을 읽고 맞으면 O, 틀리면 X를 선택해 주세요.'
            : '정답이라고 생각하는 선택지를 하나 골라주세요.'}
        </p>
      </div>
    </section>
  )
}
