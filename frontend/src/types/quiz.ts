
/**
 * MOA 금융 퀴즈 타입 정의
 */

// ==========================================
// 1. 공통 타입
// ==========================================

// 퀴즈 난이도
export type QuizDifficulty = 1 | 2 | 3

// 문제 유형
export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'OX'

// 퀴즈 진행 상태
export type QuizAttemptStatus = 'IN_PROGRESS' | 'COMPLETED'


// ==========================================
// 2. 난이도 조회
// GET /api/quiz/levels
// ==========================================

export interface QuizLevel {
  difficulty: QuizDifficulty
  name: string
  question_count: number
}

export interface QuizLevelsResponse {
  question_count_per_quiz: number
  levels: QuizLevel[]
}


// ==========================================
// 3. 퀴즈 문제 및 선택지
// ==========================================

export interface QuizOption {
  id: number
  option_text: string
  sort_order: number
}

export interface QuizQuestion {
  id: number
  difficulty: QuizDifficulty
  question_type: QuizQuestionType
  question_text: string
  options: QuizOption[]
}


// ==========================================
// 4. 퀴즈 시작
// POST /api/quiz/start
// ==========================================

export interface QuizStartRequest {
  difficulty: QuizDifficulty
}

export interface QuizStartResponse {
  difficulty: QuizDifficulty
  total_questions: number
  questions: QuizQuestion[]

  // 회원인 경우 응시 기록 ID
  attempt_id: number | null

  // 비회원인 경우 임시 토큰
  guest_token: string | null
}


// ==========================================
// 5. 퀴즈 답안 제출
// POST /api/quiz/submit
// ==========================================

// 사용자가 선택한 답변
export interface QuizAnswer {
  question_id: number
  selected_option_id: number | null
}

// 제출 요청
export interface QuizSubmitRequest {
  attempt_id?: number | null
  guest_token?: string | null
  answers: QuizAnswer[]
}


// ==========================================
// 6. 퀴즈 채점 결과
// ==========================================

// 문제별 채점 결과
export interface QuizQuestionResult {
  question_id: number
  question_text: string

  // 사용자가 선택한 선택지
  selected_option_id: number | null

  // 실제 정답
  correct_option_id: number
  correct_option_text: string

  // 정답 여부
  is_correct: boolean

  // 해설
  explanation: string

  // 관련 법령 및 출처
  source_title: string | null
  source_url: string | null
}

// 제출 결과
export interface QuizSubmitResponse {
  attempt_id: number | null
  difficulty: QuizDifficulty

  // 회원은 true, 비회원은 false
  saved: boolean

  total_questions: number
  correct_count: number
  score: number

  // 문제별 채점 결과
  results: QuizQuestionResult[]
}


// ==========================================
// 7. 회원 퀴즈 응시 기록
// GET /api/quiz/history
// ==========================================

export interface QuizHistoryItem {
  id: number
  difficulty: QuizDifficulty
  total_questions: number
  correct_count: number
  score: number
  status: QuizAttemptStatus
  created_at: string
  completed_at: string | null
}

// 페이지네이션
export interface QuizHistoryPagination {
  page: number
  size: number
  total: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// 응시 기록 목록
export interface QuizHistoryResponse {
  items: QuizHistoryItem[]
  pagination: QuizHistoryPagination
}


// ==========================================
// 8. 회원 응시 기록 상세
// GET /api/quiz/history/{attempt_id}
// ==========================================

export interface QuizHistoryDetailResponse
  extends QuizHistoryItem {
  results: QuizQuestionResult[]
}
