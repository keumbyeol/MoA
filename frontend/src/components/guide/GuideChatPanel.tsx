
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

import { getApiErrorMessage } from '../../api/client'
import {
  sendChatMessage,
  getChatSuggestions,
  type ChatHistoryItem,
  type ChatSource,
} from '../../api/chat'

interface GuideChatPanelProps {
  guideTitle: string
}

interface ChatMessage extends ChatHistoryItem {
  id: number
  sources?: ChatSource[]
}

export default function GuideChatPanel({
  guideTitle,
}: GuideChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const conversationIdRef = useRef<number | null>(null)
  const guideVersionRef = useRef(0)

  const nextId = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)

  // AI 추천 질문 조회
  const {
    data: suggestionsData,
    isPending: suggestionsLoading,
    isError: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['chat-suggestions', guideTitle],
    queryFn: () => getChatSuggestions(guideTitle),
    enabled: Boolean(guideTitle.trim()),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  })

  const suggestions = suggestionsData?.questions ?? []

  // 기존 채팅 API
  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
  })

  const isLoading = chatMutation.isPending

  // 가이드가 바뀌면 대화 초기화
  useEffect(() => {
    guideVersionRef.current += 1
    conversationIdRef.current = null
    setMessages([])
    setInput('')
    setError('')
    nextId.current = 1
  }, [guideTitle])

  // 새 메시지가 도착하면 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [messages, isLoading])

  const handleSend = async (question?: string) => {
    const text = (question ?? input).trim()

    if (!text || sendingRef.current) return

    sendingRef.current = true
    const requestGuideVersion = guideVersionRef.current

    const history: ChatHistoryItem[] = messages
      .map(({ role, content }) => ({
        role,
        content,
      }))
      .slice(-12)

    setMessages((prev) => [
      ...prev,
      {
        id: nextId.current++,
        role: 'user',
        content: text,
      },
    ])

    setInput('')
    setError('')

    try {
      const result = await chatMutation.mutateAsync({
        message:
          `현재 보고 있는 금융정보 가이드는 "${guideTitle}"입니다.\n` +
          `사용자 질문: ${text}`,
        history,
        conversation_id: conversationIdRef.current,
      })

      if (requestGuideVersion !== guideVersionRef.current) return

      conversationIdRef.current = result.conversation_id ?? null

      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          content: result.answer,
          sources: result.sources ?? [],
        },
      ])
    } catch (err) {
      if (requestGuideVersion !== guideVersionRef.current) return
      setError(
        getApiErrorMessage(
          err,
          '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      )
    } finally {
      sendingRef.current = false
    }
  }

  return (
    <aside className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      {/* 챗봇 헤더 */}
      <div className="flex items-center gap-3 border-b border-line bg-primary-50 px-5 py-4">
        <img
          src="/images/mascot/moa_cha_book2.png"
          alt=""
          className="h-12 w-12 object-contain"
        />

        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-primary-800">
              MOA 챗봇
            </h2>

            <Sparkles
              size={14}
              className="text-warning"
            />
          </div>

          <p className="mt-1 text-xs text-ink-secondary">
            금융정보를 쉽게 설명해 드릴게요.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* 첫 인사 */}
        <div className="flex items-start gap-2">
          <img
            src="/images/mascot/moa_cha_book1.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain"
          />

          <div className="min-w-0 rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
            <p className="text-xs leading-6 text-ink-secondary">
              안녕하세요!
              <br />
              <strong>{guideTitle}</strong>에 대해
              궁금한 점이 있으신가요?
            </p>
          </div>
        </div>

        {/* AI 추천 질문 */}
        {messages.length === 0 && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle
                size={16}
                className="text-primary-dark"
              />

              <h3 className="text-xs font-bold text-primary-800">
                AI가 추천하는 질문
              </h3>

              <Sparkles
                size={13}
                className="text-warning"
              />
            </div>

            {suggestionsLoading ? (
              <div
                role="status"
                className="flex items-center gap-2 py-3 text-xs text-ink-secondary"
              >
                <LoaderCircle
                  size={15}
                  className="animate-spin text-primary-dark"
                />
                추천 질문을 만들고 있어요.
              </div>
            ) : suggestionsError ? (
              <div className="space-y-2">
                <p className="text-xs leading-6 text-ink-secondary">
                  추천 질문을 불러오지 못했습니다.
                </p>

                <button
                  type="button"
                  onClick={() => void refetchSuggestions()}
                  className="text-xs font-semibold text-primary-dark hover:underline"
                >
                  다시 생성하기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((question, index) => (
                  <button
                    key={`${index}-${question}`}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleSend(question)}
                    className="flex w-full items-start gap-2 rounded-lg border border-transparent bg-surface px-3 py-2.5 text-left text-xs leading-5 text-ink-secondary transition-colors hover:border-primary-200 hover:bg-white hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="shrink-0 font-bold text-primary-dark">
                      {index + 1}.
                    </span>

                    <span>{question}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 채팅 메시지 */}
        {messages.length > 0 && (
          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => {
              const isUser = message.role === 'user'

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`min-w-0 max-w-[95%] rounded-2xl px-3 py-2.5 ${
                      isUser
                        ? 'rounded-tr-sm bg-primary-500 text-white'
                        : 'rounded-tl-sm bg-surface-muted text-ink'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words text-xs leading-6">
                        {message.content}
                      </p>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none break-words text-xs leading-6 text-ink prose-p:my-2 prose-li:my-1">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {message.sources &&
                          message.sources.length > 0 && (
                            <div className="mt-3 border-t border-line pt-3">
                              <p className="mb-2 text-[11px] font-semibold text-ink-secondary">
                                참고 자료
                              </p>

                              <div className="flex flex-wrap gap-1.5">
                                {message.sources.map(
                                  (source, index) =>
                                    source.url ? (
                                      <a
                                        key={`${source.id}-${index}`}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-primary-dark hover:bg-primary-50"
                                      >
                                        {source.title}
                                        <ExternalLink size={11} />
                                      </a>
                                    ) : (
                                      <span
                                        key={`${source.id}-${index}`}
                                        className="rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] text-ink-secondary"
                                      >
                                        {source.title}
                                      </span>
                                    ),
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-secondary">
                <LoaderCircle
                  size={15}
                  className="animate-spin text-primary-dark"
                />
                답변을 작성하고 있어요.
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
          >
            {error}
          </div>
        )}

        {/* 질문 입력창 */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSend()
          }}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-3 focus-within:border-primary"
        >
          <Bot
            size={17}
            className="shrink-0 text-primary-dark"
          />

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
            maxLength={4000}
            placeholder="궁금한 내용을 입력해 보세요."
            aria-label="AI 챗봇 질문 입력"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="질문 보내기"
            className="text-primary-dark transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Send size={17} />
            )}
          </button>
        </form>

        <p className="text-center text-[11px] leading-5 text-ink-muted">
          AI 답변은 참고용이며, 실제 적용 조건은
          공식 기관에서 확인해 주세요.
        </p>
      </div>
    </aside>
  )
}
