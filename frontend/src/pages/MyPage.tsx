
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  ArrowLeft,
  LoaderCircle,
  MessageCircle,
  X,
} from 'lucide-react'

import { authApi, type User } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import { getWageRecords } from '../api/wage'
import { guideApi } from '../api/guide'

import {
  getChatConversations,
  getChatConversation,
} from '../api/chat'

import { quizApi } from '../api/quiz'

import MyPageProfile from '../components/mypage/MyPageProfile'
import MyPageStats from '../components/mypage/MyPageStats'
import WageHistoryCard from '../components/mypage/WageHistoryCard'
import BookmarkHistoryCard from '../components/mypage/BookmarkHistoryCard'
import ChatHistoryCard from '../components/mypage/ChatHistoryCard'

import QuizHistoryCard, {
  type MyPageQuizItem,
} from '../components/mypage/QuizHistoryCard'

import ActivityHistoryModal, {
  type ActivityType,
} from '../components/mypage/ActivityHistoryModal'

// ==========================================
// 퀴즈 기록 데이터 변환
// ==========================================

function asObject(
  value: unknown,
): Record<string, unknown> | null {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getText(
  value: unknown,
): string | undefined {
  return typeof value === 'string'
    ? value
    : undefined
}

function getNumber(
  value: unknown,
): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : undefined
}

function normalizeQuizHistory(
  response: unknown,
): {
  records: MyPageQuizItem[]
  total: number
} {
  const root = asObject(response)

  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.attempts)
        ? root.attempts
        : Array.isArray(root?.history)
          ? root.history
          : []

  const records: MyPageQuizItem[] =
    rawItems.flatMap((value) => {
      const item = asObject(value)

      if (!item) return []

      const id =
        getNumber(item.id) ??
        getNumber(item.attempt_id)

      if (id === undefined) return []

      const difficulty =
        getText(item.difficulty) ??
        getText(item.level)

      const createdAt =
        getText(item.created_at) ??
        getText(item.completed_at) ??
        getText(item.submitted_at) ??
        ''

      return [
        {
          id,
          title:
            getText(item.title) ??
            '금융 상식 퀴즈',
          difficulty,
          score:
            getNumber(item.score) ??
            getNumber(item.total_score) ??
            null,
          maxScore:
            getNumber(item.max_score) ??
            getNumber(item.maxScore) ??
            null,
          createdAt,
        },
      ]
    })

  return {
    records,
    total:
      getNumber(root?.total) ??
      getNumber(root?.count) ??
      rawItems.length,
  }
}

// ==========================================
// 마이페이지
// ==========================================

export default function MyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // AI 대화 상세 모달
  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<number | null>(null)

  // 전체 활동 목록 모달
  const [
    historyTab,
    setHistoryTab,
  ] = useState<ActivityType | null>(null)

  // ==========================================
  // API 조회
  // ==========================================

  const profileQuery = useQuery({
    queryKey: ['mypage', 'profile'],
    queryFn: authApi.me,
  })

  const wageQuery = useQuery({
    queryKey: ['mypage', 'wages'],
    queryFn: () => getWageRecords(),
  })

  const bookmarkQuery = useQuery({
    queryKey: ['mypage', 'bookmarks'],
    queryFn: guideApi.getBookmarks,
  })

  const chatQuery = useQuery({
    queryKey: ['mypage', 'conversations'],
    queryFn: getChatConversations,
  })

  const quizQuery = useQuery({
    queryKey: ['mypage', 'quiz'],
    queryFn: quizApi.getHistory,
  })

  // 기존 AI 대화 상세 조회
  const conversationQuery = useQuery({
    queryKey: [
      'mypage',
      'conversation',
      selectedConversationId,
    ],
    queryFn: () =>
      getChatConversation(selectedConversationId!),
    enabled: selectedConversationId !== null,
  })

  // ==========================================
  // 회원 정보 수정 완료
  // ==========================================

  const handleProfileUpdated = (updatedUser: User) => {
    // 마이페이지 프로필 즉시 갱신
    queryClient.setQueryData(
      ['mypage', 'profile'],
      updatedUser,
    )

    // 인증 관련 캐시 갱신
    queryClient.setQueryData(
      ['auth', 'me'],
      updatedUser,
    )

    // 서버에서 최신 정보 재조회
    void queryClient.invalidateQueries({
      queryKey: ['mypage', 'profile'],
    })

    void queryClient.invalidateQueries({
      queryKey: ['auth', 'me'],
    })
  }

  // ==========================================
  // 퀴즈 데이터 변환
  // ==========================================

  const quizHistory = useMemo(
    () => normalizeQuizHistory(quizQuery.data),
    [quizQuery.data],
  )

  const isStatsLoading =
    wageQuery.isPending ||
    bookmarkQuery.isPending ||
    chatQuery.isPending ||
    quizQuery.isPending

  const hasError = [
    profileQuery,
    wageQuery,
    bookmarkQuery,
    chatQuery,
    quizQuery,
  ].some((query) => query.isError)

  // ==========================================
  // 활동 목록 모달 제어
  // ==========================================

  const openHistoryModal = (tab: ActivityType) => {
    setHistoryTab(tab)
  }

  const closeHistoryModal = () => {
    setHistoryTab(null)
  }

  const handleGuideClick = (guideId: string) => {
    closeHistoryModal()

    navigate(
      `/guides/${encodeURIComponent(guideId)}`,
    )
  }

  // ==========================================
  // 화면
  // ==========================================

  return (
    <main className="min-h-screen bg-page px-4 py-9 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* 페이지 제목 */}
        <header>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            마이페이지
          </h1>

          <p className="mt-2 text-sm text-ink-secondary">
            나의 금융 활동을 한눈에 확인해보세요!
          </p>
        </header>

        {/* =====================================
            프로필 및 활동 통계
           ===================================== */}

        <section className="space-y-6 rounded-3xl border border-primary-100 bg-surface-green p-5 sm:p-7">
          <MyPageProfile
            user={profileQuery.data}
            isLoading={profileQuery.isPending}
            onUpdated={handleProfileUpdated}
          />

          <MyPageStats
            wageCount={wageQuery.data?.length ?? 0}
            bookmarkCount={
              bookmarkQuery.data?.total ?? 0
            }
            chatCount={
              chatQuery.data?.total ?? 0
            }
            quizCount={quizHistory.total}
            isLoading={isStatsLoading}
          />
        </section>

        {/* 오류 안내 */}
        {hasError && (
          <div
            role="alert"
            className="rounded-xl border border-danger bg-danger-soft px-5 py-4 text-sm text-danger"
          >
            일부 활동 기록을 불러오지 못했습니다.
            잠시 후 새로고침해 주세요.
          </div>
        )}

        {/* =====================================
            활동 기록 카드
           ===================================== */}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {/* 임금 계산 내역 */}
          <WageHistoryCard
            records={wageQuery.data ?? []}
            isLoading={wageQuery.isPending}
            onViewAll={() =>
              openHistoryModal('wage')
            }
            onSelect={() =>
              openHistoryModal('wage')
            }
          />

          {/* 북마크 */}
          <BookmarkHistoryCard
            bookmarks={
              bookmarkQuery.data?.items ?? []
            }
            isLoading={bookmarkQuery.isPending}
            onViewAll={() =>
              openHistoryModal('bookmark')
            }
            onSelect={(guideId) =>
              handleGuideClick(guideId)
            }
          />

          {/* AI 대화 기록 */}
          <ChatHistoryCard
            conversations={
              chatQuery.data?.items ?? []
            }
            isLoading={chatQuery.isPending}
            onViewAll={() =>
              openHistoryModal('chat')
            }
            onSelect={setSelectedConversationId}
          />

          {/* 퀴즈 기록 */}
          <QuizHistoryCard
            records={quizHistory.records}
            isLoading={quizQuery.isPending}
            onViewAll={() =>
              openHistoryModal('quiz')
            }
            onSelect={() =>
              openHistoryModal('quiz')
            }
          />
        </div>

        {/* =====================================
            전체 활동 내역 공통 모달
           ===================================== */}

        {historyTab !== null && (
          <ActivityHistoryModal
            isOpen={true}
            initialTab={historyTab}
            onClose={closeHistoryModal}
            wages={wageQuery.data ?? []}
            bookmarks={
              bookmarkQuery.data?.items ?? []
            }
            conversations={
              chatQuery.data?.items ?? []
            }
            quizzes={quizHistory.records}
            loading={{
              wage: wageQuery.isPending,
              bookmark: bookmarkQuery.isPending,
              chat: chatQuery.isPending,
              quiz: quizQuery.isPending,
            }}
            onGuideClick={handleGuideClick}
          />
        )}

        {/* =====================================
            기존 AI 대화 상세 모달
           ===================================== */}

        {selectedConversationId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() =>
              setSelectedConversationId(null)
            }
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="저장된 챗봇 대화"
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-white"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* 대화 모달 헤더 */}
              <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-green px-5 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <MessageCircle
                    size={19}
                    className="text-primary-dark"
                  />

                  <h2 className="truncate font-bold text-ink">
                    {conversationQuery.data?.title ??
                      '저장된 대화'}
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() =>
                    setSelectedConversationId(null)
                  }
                  className="rounded-lg p-2 text-ink-secondary hover:bg-white"
                >
                  <X size={19} />
                </button>
              </div>

              {/* 대화 내용 */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {conversationQuery.isPending ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-secondary">
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />

                    대화를 불러오는 중입니다.
                  </div>
                ) : conversationQuery.isError ? (
                  <p className="py-10 text-center text-sm text-danger">
                    {getApiErrorMessage(
                      conversationQuery.error,
                      '대화 기록을 불러오지 못했습니다.',
                    )}
                  </p>
                ) : conversationQuery.data?.messages
                    .length === 0 ? (
                  <p className="py-10 text-center text-sm text-ink-muted">
                    저장된 메시지가 없습니다.
                  </p>
                ) : (
                  conversationQuery.data?.messages.map(
                    (message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                            message.role === 'user'
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-muted text-ink'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>

              {/* 대화 모달 하단 */}
              <div className="flex justify-end border-t border-line px-5 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedConversationId(null)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-ink-secondary hover:bg-primary-50"
                >
                  <ArrowLeft size={15} />
                  마이페이지로 돌아가기
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
