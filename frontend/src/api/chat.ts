
import { apiRequest } from './client'

export type ChatRole = 'user' | 'assistant'

export interface ChatHistoryItem {
  role: ChatRole
  content: string
}

export interface ChatSource {
  type: 'guide' | 'law' | 'policy'
  title: string
  id: string
  url: string | null
}

export interface ChatRequest {
  message: string
  history: ChatHistoryItem[]
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
}

export interface ChatSuggestionsRequest {
  guide_title: string
}

export interface ChatSuggestionsResponse {
  questions: string[]
}

// AI 챗봇 메시지 전송
export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>({
    url: '/api/chat',
    method: 'POST',
    data: request,
    timeout: 60000,
  })
}

// 현재 가이드에 맞는 추천 질문 3개 생성
export async function getChatSuggestions(
  guideTitle: string,
): Promise<ChatSuggestionsResponse> {
  return apiRequest<ChatSuggestionsResponse>({
    url: '/api/chat/suggestions',
    method: 'POST',
    data: {
      guide_title: guideTitle,
    },
    timeout: 40000,
  })
}
