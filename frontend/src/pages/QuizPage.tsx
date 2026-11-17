
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Sprout,
} from 'lucide-react'

import QuizLevelSelector from '../components/quiz/QuizLevelSelector'
import QuizProgress from '../components/quiz/QuizProgress'
import QuizQuestionCard from '../components/quiz/QuizQuestionCard'
import QuizExplanationPanel from '../components/quiz/QuizExplanationPanel'
import QuizResult from '../components/quiz/QuizResult'
import QuizChatbot from '../components/quiz/QuizChatbot'

import { useQuiz } from '../hooks/useQuiz'

const LEVEL_NAMES: Record<number, string> = {
  1: '초급',
  2: '중급',
  3: '고급',
}

export default function QuizPage() {
  const {
    levels,
    levelsLoading,
    selectedDifficulty,
    questions,
    currentQuestion,
    currentIndex,
    phase,
    selectedOptionId,
    answeredCount,
    allAnswered,
    result,
    currentResult,
    starting,
    submitting,
    startQuiz,
    selectOption,
    previousQuestion,
    nextQuestion,
    submitQuiz,
    showExplanation,
    showResult,
    backToLevels,
    retryQuiz,
  } = useQuiz()

  const isPlaying = phase === 'playing'
  const isExplanation = phase === 'explanation'

  const totalQuestions = questions.length
  const isLastQuestion = currentIndex === totalQuestions - 1

  const levelName = selectedDifficulty
    ? LEVEL_NAMES[selectedDifficulty]
    : null

  return (
    <div className="min-h-[calc(100vh-90px)] bg-white text-ink">
      <div
        className={`mx-auto grid w-full ${
          isExplanation
            ? 'max-w-[1800px] grid-cols-1'
            : 'max-w-[1440px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]'
        }`}
      >
        {/* 난이도 선택 사이드바 */}
        {!isExplanation && (
          <aside className="border-b border-primary-100 p-4 sm:p-6 lg:min-h-[calc(100vh-90px)] lg:border-b-0 lg:border-r">
            <QuizLevelSelector
              levels={levels}
              selectedDifficulty={selectedDifficulty}
              onSelect={startQuiz}
              disabled={starting || submitting}
              loading={levelsLoading}
            />
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <main
          className={`min-w-0 ${
            isExplanation
              ? 'p-4 sm:p-6 lg:p-8'
              : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          {/* 최초 진입 */}
          {phase === 'select' && (
            <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-primary-100 bg-white px-6 py-12 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
                <Sprout
                  size={46}
                  className="text-primary-600"
                />
              </div>

              <h1 className="mt-7 text-2xl font-bold sm:text-3xl">
                금융 지식 퀴즈
              </h1>

              <p className="mt-4 text-sm leading-7 text-ink-muted">
                금융 상식을 얼마나 알고 계신가요?
                <br />
                왼쪽에서 난이도를 선택하고
                <br />
                퀴즈에 도전해 보세요!
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <span className="rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700">
                  초급
                </span>

                <span className="rounded-full bg-[#fff9e9] px-4 py-2 text-xs font-semibold text-[#95711c]">
                  중급
                </span>

                <span className="rounded-full bg-[#f6f3fb] px-4 py-2 text-xs font-semibold text-[#8067a6]">
                  고급
                </span>
              </div>

              <p className="mt-7 flex items-center gap-2 text-xs text-ink-muted">
                <ClipboardList size={15} />
                난이도별 랜덤 10문제가 출제됩니다.
              </p>
            </section>
          )}

          {/* 퀴즈 진행 */}
          {isPlaying && currentQuestion && (
            <div className="mx-auto max-w-[850px]">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-primary-700">
                    {levelName} · 금융 상식
                  </p>

                  <h1 className="mt-2 text-xl font-bold sm:text-2xl">
                    금융 지식 퀴즈
                  </h1>
                </div>

                <span className="rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700">
                  {answeredCount} / {totalQuestions}문제 답변
                </span>
              </div>

              {/* 진행률 */}
              <div className="mb-5 rounded-2xl border border-primary-100 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    문제 진행률
                  </span>

                  <span className="text-xs text-ink-muted">
                    {currentIndex + 1}번째 문제
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-primary-100">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-300"
                    style={{
                      width: `${
                        ((currentIndex + 1) / totalQuestions) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <QuizQuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                selectedOptionId={selectedOptionId}
                onSelectOption={selectOption}
                disabled={submitting}
              />

              <QuizProgress
                currentIndex={currentIndex}
                totalQuestions={totalQuestions}
                onPrevious={previousQuestion}
                onNext={nextQuestion}
                onSubmit={submitQuiz}
                submitting={submitting}
                canProceed={
                  isLastQuestion
                    ? allAnswered
                    : selectedOptionId !== null
                }
              />

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#fffaf0] p-4">
                <Lightbulb
                  size={17}
                  className="mt-0.5 shrink-0 text-[#d5a72f]"
                />

                <p className="text-xs leading-6 text-[#856b35]">
                  답변은 제출 전까지 변경할 수 있습니다.
                  마지막 문제까지 모두 답변한 뒤 제출해 주세요.
                </p>
              </div>
            </div>
          )}

          {/* 채점 결과 */}
          {phase === 'result' && result && (
            <div className="mx-auto max-w-[650px]">
              <div className="mb-6">
                <p className="text-xs font-semibold text-primary-700">
                  {levelName} · 퀴즈 결과
                </p>

                <h1 className="mt-2 text-2xl font-bold">
                  나의 퀴즈 결과
                </h1>
              </div>

              <QuizResult
                result={result}
                onShowExplanation={showExplanation}
                onRetry={retryQuiz}
                onBackToLevels={backToLevels}
                retrying={starting}
              />

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 size={15} />

                {result.saved
                  ? '응시 결과가 저장되었습니다.'
                  : '비회원 응시 결과는 저장되지 않습니다.'}
              </div>
            </div>
          )}

          {/* 해설 화면 */}
          {isExplanation &&
            currentQuestion &&
            currentResult && (
              <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                {/* 왼쪽: 문제 + 해설 */}
                <div className="min-w-0">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary-700">
                        {levelName} · 정답 및 해설
                      </p>

                      <h1 className="mt-2 text-xl font-bold sm:text-2xl">
                        문제별 해설
                      </h1>
                    </div>

                    <button
                      type="button"
                      onClick={showResult}
                      className="flex items-center gap-2 rounded-full border border-primary-300 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                    >
                      <ArrowLeft size={15} />
                      결과로 돌아가기
                    </button>
                  </div>

                  {/* 문제 번호 */}
                  <div className="mb-5 flex items-center justify-between rounded-xl bg-primary-50 px-5 py-4">
                    <span className="flex items-center gap-2 text-sm font-bold text-primary-700">
                      <BookOpen size={17} />
                      문제 {currentIndex + 1}
                    </span>

                    <span className="text-xs font-semibold text-primary-700">
                      {currentIndex + 1} / {totalQuestions}
                    </span>
                  </div>

                  {/* 문제 및 선택지 */}
                  <div className="mb-5 rounded-2xl border border-primary-100 bg-white p-5 sm:p-6">
                    <h2 className="text-base font-bold leading-8 sm:text-lg">
                      Q{currentIndex + 1}.{' '}
                      {currentQuestion.question_text}
                    </h2>

                    <div className="mt-5 flex flex-col gap-2">
                      {currentQuestion.options.map(
                        (option, index) => {
                          const isCorrect =
                            option.id ===
                            currentResult.correct_option_id

                          const isSelected =
                            option.id ===
                            currentResult.selected_option_id

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                                isCorrect
                                  ? 'border-primary-400 bg-primary-50'
                                  : isSelected
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-gray-200 bg-white'
                              }`}
                            >
                              <span className="shrink-0 text-xs font-bold text-ink-muted">
                                {currentQuestion.question_type === 'OX'
                                  ? option.option_text
                                  : index + 1}
                              </span>

                              <span className="min-w-0 flex-1 text-sm leading-6">
                                {option.option_text}
                              </span>

                              {isCorrect && (
                                <span className="shrink-0 text-xs font-bold text-primary-700">
                                  정답
                                </span>
                              )}

                              {isSelected && !isCorrect && (
                                <span className="shrink-0 text-xs font-bold text-red-500">
                                  내 선택
                                </span>
                              )}
                            </div>
                          )
                        },
                      )}
                    </div>
                  </div>

                  {/* DB 해설 */}
                  <QuizExplanationPanel
                    question={currentQuestion}
                    result={currentResult}
                  />

                  {/* 이전 / 다음 해설 */}
                  <div className="mt-7 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={previousQuestion}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-primary-400 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft size={16} />
                      이전 해설
                    </button>

                    {isLastQuestion ? (
                      <button
                        type="button"
                        onClick={showResult}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 text-sm font-semibold text-white hover:bg-primary-600"
                      >
                        결과 보기
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 text-sm font-semibold text-white hover:bg-primary-600"
                      >
                        다음 해설
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 오른쪽: AI 챗봇 상시 표시 */}
                <aside className="min-w-0 lg:sticky lg:top-[106px]">
                  <div className="h-[580px] overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm lg:h-[calc(100vh-130px)] lg:min-h-[520px]">
                    <QuizChatbot
                      key={`${result?.attempt_id ?? 'guest'}-${currentQuestion.id}`}
                      questionId={currentQuestion.id}
                    />
                  </div>
                </aside>
              </div>
            )}

          {/* 로딩 */}
          {starting && (
            <div
              role="status"
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/60"
            >
              <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-lg">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />

                <p className="text-sm font-semibold">
                  퀴즈를 준비하고 있습니다...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
