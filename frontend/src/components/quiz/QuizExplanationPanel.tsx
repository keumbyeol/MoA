
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Lightbulb,
  XCircle,
} from 'lucide-react'

import type {
  QuizQuestion,
  QuizQuestionResult,
} from '../../types/quiz'

interface QuizExplanationPanelProps {
  question: QuizQuestion
  result: QuizQuestionResult
}

export default function QuizExplanationPanel({
  question,
  result,
}: QuizExplanationPanelProps) {
  const correctOption = question.options.find(
    (option) => option.id === result.correct_option_id,
  )

  const selectedOption = question.options.find(
    (option) => option.id === result.selected_option_id,
  )

  const correctText =
    correctOption?.option_text ??
    result.correct_option_text ??
    '정답 정보 없음'

  return (
    <section className="flex flex-col gap-4">
      {/* 정답 여부 */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: result.is_correct
            ? 'var(--color-primary-50, #f3faeb)'
            : '#fff3f0',
        }}
      >
        <div className="flex items-center gap-2">
          {result.is_correct ? (
            <CheckCircle2
              size={23}
              style={{ color: '#69b441' }}
            />
          ) : (
            <XCircle
              size={23}
              style={{ color: '#dc746a' }}
            />
          )}

          <h3 className="text-base font-bold">
            {result.is_correct
              ? '정답이에요!'
              : '아쉬워요! 다시 알아볼까요?'}
          </h3>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-3 rounded-lg bg-white/80 p-3">
            <span
              className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: '#72b44a' }}
            >
              정답
            </span>

            <span className="text-sm font-semibold leading-6">
              {correctText}
            </span>
          </div>

          {!result.is_correct && (
            <div className="flex items-start gap-3 rounded-lg bg-white/80 p-3">
              <span
                className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: '#dc746a' }}
              >
                내 답
              </span>

              <span className="text-sm leading-6">
                {selectedOption?.option_text ?? '선택하지 않음'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 상세 해설 */}
      <div
        className="rounded-2xl border bg-white p-5"
        style={{
          borderColor: 'var(--color-line, #edf0eb)',
        }}
      >
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <FileText
            size={18}
            style={{
              color: 'var(--color-primary-600, #568b30)',
            }}
          />
          해설
        </h3>

        <p
          className="mt-3 whitespace-pre-line text-sm leading-7"
          style={{
            color: 'var(--color-ink-secondary, #69736a)',
          }}
        >
          {result.explanation}
        </p>
      </div>

      {/* 핵심 정리 */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: '#fff9e9' }}
      >
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Lightbulb size={18} style={{ color: '#e3b73d' }} />
          한눈에 정리
        </h3>

        <p className="mt-3 text-sm leading-7">
          {result.explanation}
        </p>
      </div>

      {/* 관련 법령 및 출처 */}
      {(result.source_title || result.source_url) && (
        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: 'var(--color-line, #edf0eb)',
          }}
        >
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <BookOpen
              size={18}
              style={{
                color: 'var(--color-primary-600, #568b30)',
              }}
            />
            관련 정보
          </h3>

          <p
            className="mt-3 text-sm"
            style={{
              color: 'var(--color-ink-secondary, #69736a)',
            }}
          >
            {result.source_title ?? '참고 자료'}
          </p>

          {result.source_url && (
            <a
              href={result.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold hover:opacity-80"
              style={{
                borderColor:
                  'var(--color-primary-400, #91c94e)',
                color:
                  'var(--color-primary-600, #568b30)',
              }}
            >
              자세히 알아보기
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </section>
  )
}
