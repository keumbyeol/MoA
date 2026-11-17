
import { useCallback, useEffect, useMemo, useState } from 'react'

import { quizApi } from '../api/quiz'
import { getApiErrorMessage } from '../api/client'
import { message } from '../components/common/Message'

import type {
  QuizDifficulty,
  QuizLevel,
  QuizQuestion,
  QuizSubmitResponse,
  QuizStartResponse,
} from '../types/quiz'

export type QuizPhase =
  | 'select'
  | 'playing'
  | 'result'
  | 'explanation'

export function useQuiz() {
  const [levels, setLevels] = useState<QuizLevel[]>([])
  const [levelsLoading, setLevelsLoading] = useState(true)

  const [quiz, setQuiz] = useState<QuizStartResponse | null>(null)
  const [result, setResult] = useState<QuizSubmitResponse | null>(null)

  const [phase, setPhase] = useState<QuizPhase>('select')
  const [currentIndex, setCurrentIndex] = useState(0)

  const [answers, setAnswers] = useState<Record<number, number>>({})

  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 난이도별 문제 수 조회
  const loadLevels = useCallback(async () => {
    setLevelsLoading(true)

    try {
      const response = await quizApi.getLevels()
      setLevels(response.levels)
    } catch (error) {
      message.error(
        getApiErrorMessage(
          error,
          '퀴즈 난이도 정보를 불러오지 못했습니다.',
        ),
      )
    } finally {
      setLevelsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLevels()
  }, [loadLevels])

  const selectedDifficulty: QuizDifficulty | null =
    quiz?.difficulty ?? null

  const questions = useMemo<QuizQuestion[]>(
    () => quiz?.questions ?? [],
    [quiz],
  )

  const currentQuestion = questions[currentIndex] ?? null

  const selectedOptionId = currentQuestion
    ? (answers[currentQuestion.id] ?? null)
    : null

  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length

  const allAnswered =
    questions.length > 0 && answeredCount === questions.length

  // 퀴즈 시작
  const startQuiz = useCallback(
    async (difficulty: QuizDifficulty) => {
      if (starting || submitting) return

      setStarting(true)

      try {
        const response = await quizApi.startQuiz(difficulty)

        if (!response.questions.length) {
          message.warning('출제할 수 있는 문제가 없습니다.')
          return
        }

        setQuiz(response)
        setResult(null)
        setAnswers({})
        setCurrentIndex(0)
        setPhase('playing')
      } catch (error) {
        message.error(
          getApiErrorMessage(
            error,
            '퀴즈를 시작하지 못했습니다.',
          ),
        )
      } finally {
        setStarting(false)
      }
    },
    [starting, submitting],
  )

  // 선택지 선택
  const selectOption = useCallback(
    (optionId: number) => {
      if (phase !== 'playing' || !currentQuestion) return

      setAnswers((previous) => ({
        ...previous,
        [currentQuestion.id]: optionId,
      }))
    },
    [phase, currentQuestion],
  )

  // 이전 문제
  const previousQuestion = useCallback(() => {
    setCurrentIndex((previous) => Math.max(0, previous - 1))
  }, [])

  // 다음 문제
  const nextQuestion = useCallback(() => {
    setCurrentIndex((previous) =>
      Math.min(questions.length - 1, previous + 1),
    )
  }, [questions.length])

  // 답안 제출
  const submitQuiz = useCallback(async () => {
    if (!quiz || submitting || phase !== 'playing') return

    if (!allAnswered) {
      message.warning('모든 문제의 답을 선택해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      const response = await quizApi.submitQuiz({
        attempt_id: quiz.attempt_id,
        guest_token: quiz.guest_token,
        answers: quiz.questions.map((question) => ({
          question_id: question.id,
          selected_option_id: answers[question.id] ?? null,
        })),
      })

      setResult(response)
      setCurrentIndex(0)
      setPhase('result')

      message.success('퀴즈 채점이 완료되었습니다.')
    } catch (error) {
      message.error(
        getApiErrorMessage(
          error,
          '퀴즈 제출에 실패했습니다.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }, [quiz, answers, allAnswered, submitting, phase])

  // 해설 화면 열기
  const showExplanation = useCallback(() => {
    if (!result) return

    setCurrentIndex(0)
    setPhase('explanation')
  }, [result])

  // 결과 화면으로 돌아가기
  const showResult = useCallback(() => {
    if (!result) return

    setPhase('result')
  }, [result])

  // 난이도 선택 화면으로 돌아가기
  const backToLevels = useCallback(() => {
    setQuiz(null)
    setResult(null)
    setAnswers({})
    setCurrentIndex(0)
    setPhase('select')
  }, [])

  // 같은 난이도 다시 풀기
  const retryQuiz = useCallback(async () => {
    if (!quiz) return
    await startQuiz(quiz.difficulty)
  }, [quiz, startQuiz])

  // 현재 문제의 채점 결과
  const currentResult = useMemo(
    () =>
      currentQuestion
        ? result?.results.find(
            (item) => item.question_id === currentQuestion.id,
          ) ?? null
        : null,
    [currentQuestion, result],
  )

  return {
    // 난이도
    levels,
    levelsLoading,
    loadLevels,
    selectedDifficulty,

    // 퀴즈
    quiz,
    questions,
    currentQuestion,
    currentIndex,
    phase,

    // 답변
    answers,
    selectedOptionId,
    answeredCount,
    allAnswered,

    // 결과
    result,
    currentResult,

    // 로딩
    starting,
    submitting,

    // 동작
    startQuiz,
    selectOption,
    previousQuestion,
    nextQuestion,
    submitQuiz,
    showExplanation,
    showResult,
    backToLevels,
    retryQuiz,
  }
}
