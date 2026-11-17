
import { apiRequest } from './client'

import type {
  QuizDifficulty,
  QuizLevelsResponse,
  QuizStartResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
  QuizHistoryResponse,
  QuizHistoryDetailResponse,
} from '../types/quiz'

const QUIZ_API_PATH = '/api/quiz'

export const quizApi = {
  // 난이도별 문제 수 조회
  getLevels: (): Promise<QuizLevelsResponse> =>
    apiRequest<QuizLevelsResponse>({
      method: 'GET',
      url: `${QUIZ_API_PATH}/levels`,
    }),

  // 퀴즈 시작 (난이도별 랜덤 10문제)
  startQuiz: (
    difficulty: QuizDifficulty,
  ): Promise<QuizStartResponse> =>
    apiRequest<QuizStartResponse>({
      method: 'POST',
      url: `${QUIZ_API_PATH}/start`,
      data: {
        difficulty,
      },
    }),

  // 퀴즈 답안 제출 및 채점
  submitQuiz: (
    request: QuizSubmitRequest,
  ): Promise<QuizSubmitResponse> =>
    apiRequest<QuizSubmitResponse>({
      method: 'POST',
      url: `${QUIZ_API_PATH}/submit`,
      data: request,
    }),

  // 회원 퀴즈 응시 기록 조회
  getHistory: (): Promise<QuizHistoryResponse> =>
    apiRequest<QuizHistoryResponse>({
      method: 'GET',
      url: `${QUIZ_API_PATH}/history`,
    }),

  // 회원 퀴즈 응시 기록 상세 조회
  getHistoryDetail: (
    attemptId: number,
  ): Promise<QuizHistoryDetailResponse> =>
    apiRequest<QuizHistoryDetailResponse>({
      method: 'GET',
      url: `${QUIZ_API_PATH}/history/${attemptId}`,
    }),
}
