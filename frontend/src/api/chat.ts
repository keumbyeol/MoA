
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

// ==========================================
// AI 챗봇 요청 및 응답
// ==========================================

export interface ChatRequest {
  message: string
  history: ChatHistoryItem[]

  // 기존 대화를 이어서 진행할 때 사용
  conversation_id?: number | null
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]

  // 로그인한 회원의 저장된 대화 ID
  conversation_id?: number | null
}

export interface ChatSuggestionsRequest {
  guide_title: string
}

export interface ChatSuggestionsResponse {
  questions: string[]
}

// ==========================================
// 대화 기록 관련 타입
// ==========================================

export interface ChatConversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface ChatSavedMessage {
  id: number
  conversation_id: number
  role: ChatRole
  content: string
  sources?: ChatSource[]
  created_at: string
}

export interface ChatConversationDetail extends ChatConversation {
  messages: ChatSavedMessage[]
}

export interface ChatConversationListResponse {
  total: number
  items: ChatConversation[]
}

// ==========================================
// AI 챗봇 메시지 전송
// POST /api/chat
// ==========================================

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

// ==========================================
// 현재 가이드에 맞는 추천 질문 3개 생성
// POST /api/chat/suggestions
// ==========================================

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

// ==========================================
// 내 대화 기록 목록
// GET /api/chat/conversations
// ==========================================

export async function getChatConversations(): Promise<ChatConversationListResponse> {
  return apiRequest<ChatConversationListResponse>({
    url: '/api/chat/conversations',
    method: 'GET',
  })
}

// ==========================================
// 대화 기록 상세 조회
// GET /api/chat/conversations/{conversation_id}
// ==========================================

export async function getChatConversation(
  conversationId: number,
): Promise<ChatConversationDetail> {
  return apiRequest<ChatConversationDetail>({
    url: `/api/chat/conversations/${conversationId}`,
    method: 'GET',
  })
}

// ==========================================
// 대화 기록 삭제
// DELETE /api/chat/conversations/{conversation_id}
// ==========================================

export async function deleteChatConversation(
  conversationId: number,
): Promise<void> {
  await apiRequest<void>({
    url: `/api/chat/conversations/${conversationId}`,
    method: 'DELETE',
  })
}
