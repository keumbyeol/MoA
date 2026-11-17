
import { apiRequest } from './client'

export interface QuizChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface QuizChatRequest {
  question_id: number
  message: string
  history: QuizChatMessage[]
}

export interface QuizChatSource {
  type: string
  title: string
  id: string
  url: string | null
}

export interface QuizChatResponse {
  question_id: number
  answer: string
  sources: QuizChatSource[]
}

export const quizChatApi = {
  sendMessage: (
    request: QuizChatRequest,
  ): Promise<QuizChatResponse> =>
    apiRequest<QuizChatResponse>({
      method: 'POST',
      url: '/api/chat/quiz',
      data: request,
    }),
}
