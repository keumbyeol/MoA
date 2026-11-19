
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Calculator,
  ChevronRight,
  ClipboardCheck,
  LoaderCircle,
  MessageCircle,
  X,
} from 'lucide-react'

import type { ComponentType } from 'react'
import type { MyPageQuizItem } from './QuizHistoryCard'

import { getWageRecord } from '../../api/wage'
import { getChatConversation } from '../../api/chat'
import { quizApi } from '../../api/quiz'
import { getApiErrorMessage } from '../../api/client'

export type ActivityType =
  | 'wage'
  | 'bookmark'
  | 'chat'
  | 'quiz'

type ActivityRecord = Record<string, unknown>

interface ActivityHistoryModalProps {
  isOpen: boolean
  initialTab: ActivityType
  onClose: () => void

  wages: unknown[]
  bookmarks: unknown[]
  conversations: unknown[]
  quizzes: MyPageQuizItem[]

  loading?: Partial<Record<ActivityType, boolean>>
  onGuideClick: (guideId: string) => void
}

interface TabItem {
  id: ActivityType
  label: string
  icon: ComponentType<{
    size?: number
    className?: string
  }>
}

const TABS: TabItem[] = [
  {
    id: 'wage',
    label: '임금 계산',
    icon: Calculator,
  },
  {
    id: 'bookmark',
    label: '북마크',
    icon: Bookmark,
  },
  {
    id: 'chat',
    label: 'AI 채팅',
    icon: MessageCircle,
  },
  {
    id: 'quiz',
    label: '퀴즈',
    icon: ClipboardCheck,
  },
]

function asObject(value: unknown): ActivityRecord | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null
  }

  return value as ActivityRecord
}

function getText(value: unknown): string | undefined {
  return typeof value === 'string'
    ? value
    : undefined
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function formatDate(value: unknown): string {
  const text = getText(value)

  if (!text) return '-'

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) {
    return text
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatMoney(value: unknown): string {
  const amount = getNumber(value)

  if (amount === undefined) return '-'

  return `${amount.toLocaleString('ko-KR')}원`
}

function difficultyLabel(value: unknown): string {
  const text =
    getText(value) ??
    (getNumber(value) !== undefined
      ? String(value)
      : undefined)

  const labels: Record<string, string> = {
    '1': '초급',
    '2': '중급',
    '3': '고급',
    EASY: '초급',
    MEDIUM: '중급',
    HARD: '고급',
  }

  return text ? labels[text] ?? text : '금융 상식'
}

function getRecordId(value: unknown): number | undefined {
  const item = asObject(value)

  if (!item) return undefined

  return (
    getNumber(item.id) ??
    getNumber(item.record_id) ??
    getNumber(item.attempt_id)
  )
}

function getWageTitle(value: unknown): string {
  const item = asObject(value)

  if (!item) return '임금 계산 기록'

  const year =
    getNumber(item.target_year) ??
    getNumber(item.year)

  const month =
    getNumber(item.target_month) ??
    getNumber(item.month)

  if (year !== undefined && month !== undefined) {
    return `${year}년 ${month}월 임금 계산`
  }

  return (
    getText(item.title) ??
    getText(item.name) ??
    '임금 계산 기록'
  )
}

function getWageAmount(value: unknown): unknown {
  const item = asObject(value)

  if (!item) return undefined

  const result = asObject(item.result_data)

  return (
    item.total_pay ??
    item.total_wage ??
    item.gross_pay ??
    result?.total_pay ??
    result?.total_wage ??
    result?.gross_pay
  )
}

function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <span className="text-ink-muted">
        정보 없음
      </span>
    )
  }

  if (typeof value === 'object') {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-page p-4 text-xs leading-6 text-ink">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return <span>{String(value)}</span>
}

function EmptyState({
  icon: Icon,
}: {
  icon: TabItem['icon']
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-14 text-center">
      <Icon
        size={30}
        className="mx-auto text-primary-300"
      />

      <p className="mt-4 text-sm font-semibold text-ink">
        저장된 기록이 없습니다.
      </p>

      <p className="mt-2 text-xs text-ink-secondary">
        활동을 완료하면 이곳에서 확인할 수 있습니다.
      </p>
    </div>
  )
}

function LoadingState({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-secondary">
      <LoaderCircle
        size={18}
        className="animate-spin"
      />

      {message}
    </div>
  )
}

function ListButton({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: TabItem['icon']
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-ink-secondary">
          {description}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-ink-muted"
      />
    </button>
  )
}

export default function ActivityHistoryModal({
  isOpen,
  initialTab,
  onClose,
  wages,
  bookmarks,
  conversations,
  quizzes,
  loading = {},
  onGuideClick,
}: ActivityHistoryModalProps) {
  const [activeTab, setActiveTab] =
    useState<ActivityType>(initialTab)

  const [selectedId, setSelectedId] =
    useState<number | null>(null)

  const [detailLoading, setDetailLoading] =
    useState(false)

  const [detailError, setDetailError] =
    useState('')

  const [detailData, setDetailData] =
    useState<unknown>(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!isOpen) return

    requestIdRef.current += 1

    setActiveTab(initialTab)
    setSelectedId(null)
    setDetailLoading(false)
    setDetailError('')
    setDetailData(null)
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const resetDetail = () => {
    requestIdRef.current += 1

    setSelectedId(null)
    setDetailLoading(false)
    setDetailError('')
    setDetailData(null)
  }

  const changeTab = (tab: ActivityType) => {
    resetDetail()
    setActiveTab(tab)
  }

  const openDetail = async (id: number) => {
    const requestId = ++requestIdRef.current
    const requestedTab = activeTab

    setSelectedId(id)
    setDetailLoading(true)
    setDetailError('')
    setDetailData(null)

    try {
      let data: unknown = null

      if (requestedTab === 'wage') {
        data = await getWageRecord(id)
      } else if (requestedTab === 'chat') {
        data = await getChatConversation(id)
      } else if (requestedTab === 'quiz') {
        data = await quizApi.getHistoryDetail(id)
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      setDetailData(data)
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setDetailError(
        getApiErrorMessage(
          error,
          '상세 기록을 불러오지 못했습니다.',
        ),
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setDetailLoading(false)
      }
    }
  }

  const currentTab =
    TABS.find((tab) => tab.id === activeTab) ??
    TABS[0]

  const count: Record<ActivityType, number> = {
    wage: wages.length,
    bookmark: bookmarks.length,
    chat: conversations.length,
    quiz: quizzes.length,
  }

  const isDetail = selectedId !== null
  const detail = asObject(detailData)

  const chatMessages = Array.isArray(detail?.messages)
    ? detail.messages
    : []

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="전체 활동 내역"
        className="flex max-h-[88vh] min-h-[400px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {isDetail
                ? `${currentTab.label} 상세`
                : '전체 활동 내역'}
            </h2>

            <p className="mt-1 text-xs text-ink-secondary">
              저장된 금융 활동 기록을 확인해 보세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-2 text-ink-secondary hover:bg-page"
          >
            <X size={20} />
          </button>
        </div>

        {/* 카테고리 탭 */}
        {!isDetail && (
          <div className="grid grid-cols-4 border-b border-line bg-white">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const selected = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors sm:flex-row ${
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-transparent text-ink-secondary hover:bg-page'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-page px-4 py-5 sm:px-6">
          {isDetail ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={resetDetail}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                <ArrowLeft size={16} />
                목록으로 돌아가기
              </button>

              {detailLoading ? (
                <LoadingState message="기록을 불러오는 중입니다." />
              ) : detailError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-danger bg-danger-soft p-4 text-sm text-danger"
                >
                  {detailError}
                </div>
              ) : activeTab === 'wage' && detail ? (
                <div className="space-y-5 rounded-xl border border-line bg-white p-5">
                  <div>
                    <h3 className="font-bold text-ink">
                      {getWageTitle(detail)}
                    </h3>

                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDate(detail.created_at)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-primary-50 p-4">
                      <p className="text-xs text-ink-secondary">
                        시급
                      </p>

                      <p className="mt-2 font-bold text-ink">
                        {formatMoney(
                          detail.hourly_wage ??
                            detail.hourly_rate,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-primary-50 p-4">
                      <p className="text-xs text-ink-secondary">
                        계산된 총급여
                      </p>

                      <p className="mt-2 font-bold text-primary-800">
                        {formatMoney(getWageAmount(detail))}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-ink">
                    계산 결과 상세
                  </h4>

                  <DetailValue
                    value={
                      detail.result_data ??
                      detail.result ??
                      detail
                    }
                  />
                </div>
              ) : activeTab === 'chat' && detail ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-ink">
                    {getText(detail.title) ??
                      '저장된 대화'}
                  </h3>

                  {chatMessages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-ink-muted">
                      저장된 메시지가 없습니다.
                    </p>
                  ) : (
                    chatMessages.map((value, index) => {
                      const message = asObject(value)

                      if (!message) return null

                      const isUser =
                        message.role === 'user'

                      return (
                        <div
                          key={
                            getNumber(message.id) ??
                            index
                          }
                          className={`flex ${
                            isUser
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                              isUser
                                ? 'bg-primary-500 text-white'
                                : 'border border-line bg-white text-ink'
                            }`}
                          >
                            {getText(message.content) ??
                              ''}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : activeTab === 'quiz' && detailData ? (
                <div className="rounded-xl border border-line bg-white p-5">
                  <h3 className="mb-4 font-bold text-ink">
                    퀴즈 응시 상세
                  </h3>

                  <DetailValue value={detailData} />
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-ink-muted">
                  상세 기록을 표시할 수 없습니다.
                </p>
              )}
            </div>
          ) : loading[activeTab] ? (
            <LoadingState message="목록을 불러오는 중입니다." />
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">
                  {currentTab.label} 내역
                </h3>

                <span className="text-xs text-ink-secondary">
                  총 {count[activeTab]}개
                </span>
              </div>

              {/* 임금 계산 */}
              {activeTab === 'wage' &&
                wages.map((value, index) => {
                  const record = asObject(value)
                  const id = getRecordId(value)

                  if (!record || id === undefined) {
                    return null
                  }

                  return (
                    <ListButton
                      key={id}
                      icon={Calculator}
                      title={getWageTitle(record)}
                      description={`${formatMoney(
                        getWageAmount(record),
                      )} · ${formatDate(
                        record.created_at,
                      )}`}
                      onClick={() => {
                        void openDetail(id)
                      }}
                    />
                  )
                })}

              {/* 북마크 */}
              {activeTab === 'bookmark' &&
                bookmarks.map((value, index) => {
                  const bookmark = asObject(value)

                  if (!bookmark) return null

                  const guide = asObject(bookmark.guide)

                  const guideId =
                    getText(bookmark.guide_id) ??
                    String(bookmark.guide_id ?? '')

                  return (
                    <ListButton
                      key={
                        getRecordId(value) ??
                        index
                      }
                      icon={BookOpen}
                      title={
                        getText(guide?.title) ??
                        getText(bookmark.title) ??
                        '저장한 금융 가이드'
                      }
                      description={formatDate(
                        bookmark.created_at,
                      )}
                      onClick={() => {
                        if (guideId) {
                          onGuideClick(guideId)
                        }
                      }}
                    />
                  )
                })}

              {/* AI 채팅 */}
              {activeTab === 'chat' &&
                conversations.map((value, index) => {
                  const conversation = asObject(value)
                  const id = getRecordId(value)

                  if (!conversation || id === undefined) {
                    return null
                  }

                  return (
                    <ListButton
                      key={id}
                      icon={MessageCircle}
                      title={
                        getText(conversation.title) ??
                        '새 대화'
                      }
                      description={formatDate(
                        conversation.updated_at ??
                          conversation.created_at,
                      )}
                      onClick={() => {
                        void openDetail(id)
                      }}
                    />
                  )
                })}

              {/* 퀴즈 */}
              {activeTab === 'quiz' &&
                quizzes.map((quiz) => {
                  const scoreText =
                    quiz.score !== null &&
                    quiz.score !== undefined
                      ? quiz.maxScore !== null &&
                        quiz.maxScore !== undefined
                        ? `${quiz.score} / ${quiz.maxScore}`
                        : `${quiz.score}점`
                      : '점수 정보 없음'

                  return (
                    <ListButton
                      key={quiz.id}
                      icon={ClipboardCheck}
                      title={quiz.title}
                      description={`${difficultyLabel(
                        quiz.difficulty,
                      )} · ${scoreText} · ${formatDate(
                        quiz.createdAt,
                      )}`}
                      onClick={() => {
                        void openDetail(quiz.id)
                      }}
                    />
                  )
                })}

              {/* 기록 없음 */}
              {count[activeTab] === 0 && (
                <EmptyState icon={currentTab.icon} />
              )}
            </div>
          )}
        </div>

        {/* 하단 */}
        <div className="flex justify-end border-t border-line bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-page"
          >
            닫기
          </button>
        </div>
      </section>
    </div>
  )
}
