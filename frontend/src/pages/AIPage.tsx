
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  ArrowUp,
  BookOpen,
  Bot,
  ExternalLink,
  FileText,
  Landmark,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import { getApiErrorMessage } from '../api/client'
import {
  sendChatMessage,
  type ChatHistoryItem,
  type ChatSource,
} from '../api/chat'

interface Message extends ChatHistoryItem {
  id: number
  sources?: ChatSource[]
}

const SUGGESTIONS = [
  '주휴수당은 어떤 조건에서 받을 수 있나요?',
  '연차휴가는 언제부터 발생하나요?',
  '4대보험 가입 조건을 알려주세요.',
  '청년을 위한 정부지원 정책을 알려주세요.',
]

function SourceList({ sources }: { sources: ChatSource[] }) {
  if (sources.length === 0) return null

  const getIcon = (type: ChatSource['type']) => {
    switch (type) {
      case 'law':
        return <Landmark size={14} />
      case 'policy':
        return <FileText size={14} />
      default:
        return <BookOpen size={14} />
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2 text-xs font-semibold text-ink-secondary">
        참고 자료
      </p>

      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const key = `${source.type}-${source.id}-${index}`

          const label = (
            <>
              {getIcon(source.type)}
              <span>{source.title}</span>
              {source.url && <ExternalLink size={12} />}
            </>
          )

          const className =
            'inline-flex items-center gap-1.5 rounded-full ' +
            'border border-line bg-white px-3 py-1.5 ' +
            'text-xs text-ink-secondary transition-colors ' +
            'hover:border-primary-300 hover:text-primary-700'

          if (source.url) {
            return (
              <a
                key={key}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {label}
              </a>
            )
          }

          return (
            <span key={key} className={className}>
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<number | null>(null)

  const nextId = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
  })

  const isLoading = chatMutation.isPending

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages, isLoading, error])

  const handleSend = async (value?: string) => {
    const question = (value ?? input).trim()

    if (!question || isLoading) return

    const history: ChatHistoryItem[] = messages
      .map(({ role, content }) => ({ role, content }))
      .slice(-12)

    const userMessage: Message = {
      id: nextId.current++,
      role: 'user',
      content: question,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError('')

    try {
      const result = await chatMutation.mutateAsync({
        message: question,
        history,
        conversation_id: conversationId,
      })

      setConversationId(result.conversation_id ?? null)

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
      setError(
        getApiErrorMessage(
          err,
          'AI 답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      )
    }
  }

  const handleReset = () => {
    if (isLoading) return

    setMessages([])
    setConversationId(null)
    setInput('')
    setError('')
    chatMutation.reset()
    textareaRef.current?.focus()
  }

  const handleRetry = () => {
    const last = messages.at(-1)

    if (!last || last.role !== 'user') return

    setMessages((prev) => prev.slice(0, -1))
    setInput(last.content)
    setError('')
  }

  return (
    <main className="min-h-screen bg-page px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-700">
            <Sparkles size={14} />
            MOA AI Q&A
          </div>

          <h1 className="text-3xl font-bold text-ink">
            모아에게 물어보세요
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            급여, 근로제도, 세금, 사회보험, 정부지원 정책까지
            궁금한 내용을 편하게 질문해 보세요.
          </p>
        </header>

        <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-line bg-surface-green px-5 py-4 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-200 text-primary-800">
                <Bot size={23} />
              </div>

              <div>
                <h2 className="text-base font-bold text-ink">
                  MOA 금융 도우미
                </h2>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  금융·근로 정보를 함께 알아봐요
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink-secondary hover:bg-primary-50 disabled:opacity-50"
            >
              <RotateCcw size={14} />
              새 대화
            </button>
          </div>

          <div
            className="h-[480px] space-y-5 overflow-y-auto bg-white px-4 py-6 md:px-7"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="flex min-h-full flex-col items-center justify-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 text-primary-700">
                  <Bot size={39} strokeWidth={1.6} />
                </div>

                <h3 className="text-xl font-bold text-ink">
                  무엇이 궁금하신가요?
                </h3>

                <p className="mt-3 text-center text-sm leading-6 text-ink-secondary">
                  처음 알아보는 금융·근로 정보도
                  <br />
                  모아가 이해하기 쉽게 설명해 드릴게요.
                </p>

                <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void handleSend(suggestion)}
                      disabled={isLoading}
                      className="rounded-2xl border border-line bg-surface-cream px-4 py-3 text-left text-sm leading-6 text-ink-secondary transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    className={`max-w-[90%] rounded-2xl px-4 py-3 md:max-w-[82%] md:px-5 md:py-4 ${
                      isUser
                        ? 'rounded-tr-sm bg-primary-500 text-white'
                        : 'rounded-tl-sm border border-line bg-surface-muted text-ink'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.content}
                      </p>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none break-words leading-7 text-ink prose-headings:text-ink prose-strong:text-ink">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        <SourceList
                          sources={message.sources ?? []}
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm text-ink-secondary">
                  <LoaderCircle
                    size={17}
                    className="animate-spin text-primary-600"
                  />
                  모아가 답변을 준비하고 있어요.
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {error}
                <button
                  type="button"
                  onClick={handleRetry}
                  className="ml-3 font-semibold underline"
                >
                  다시 입력
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleSend()
            }}
            className="border-t border-line bg-surface px-4 py-4 md:px-7"
          >
            <div className="flex items-end gap-3 rounded-2xl border border-line-strong bg-white p-2 focus-within:border-primary-500">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="궁금한 금융·근로 정보를 질문해 보세요."
                maxLength={4000}
                rows={2}
                disabled={isLoading}
                className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted disabled:opacity-60"
                aria-label="챗봇 질문 입력"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="메시지 보내기"
                className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowUp size={20} />
                )}
              </button>
            </div>

            <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
              AI 답변은 참고용 정보이며, 실제 적용 조건과
              최신 법령·정책은 공식 기관에서 확인해 주세요.
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}
