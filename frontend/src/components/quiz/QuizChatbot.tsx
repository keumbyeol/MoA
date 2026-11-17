
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  Bot,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { useQuizChat } from '../../hooks/useQuizChat'

interface QuizChatbotProps {
  questionId: number
}

export default function QuizChatbot({
  questionId,
}: QuizChatbotProps) {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  } = useQuizChat(questionId)

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput('')
  }, [questionId])

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop =
        chatAreaRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSubmit = async (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault()

    const text = input.trim()

    if (!text || loading) return

    setInput('')

    const success = await sendMessage(text)

    if (!success) {
      setInput((previous) => previous || text)
    }
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      {/* 챗봇 헤더 */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary-100 bg-primary-50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary-700">
            <Bot size={25} />
          </div>

          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
              모아 AI 해설 도우미
              <Sparkles
                size={15}
                className="text-primary-600"
              />
            </h3>

            <p className="mt-1 text-[12px] text-ink-muted">
              현재 문제에 관해 자유롭게 질문해 보세요.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearMessages}
          disabled={loading || messages.length === 0}
          title="현재 문제의 대화 초기화"
          aria-label="대화 초기화"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* 현재 문제 안내 */}
      <div className="shrink-0 border-b border-primary-100 bg-white px-5 py-3">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-primary-700">
          <Sparkles size={14} />
          현재 문제의 정답과 해설을 참고하여 답변합니다.
        </p>
      </div>

      {/* 대화 영역 */}
      <div
        ref={chatAreaRef}
        aria-label="퀴즈 AI 대화"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white px-4 py-5"
      >
        {/* 초기 안내 */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
            <Bot size={18} />
          </div>

          <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
            <p className="text-[13px] leading-6 text-ink">
              안녕하세요! 모아 AI입니다.
              <br />
              현재 문제에서 이해되지 않는 부분이 있다면
              자유롭게 질문해 주세요.
            </p>
          </div>
        </div>

        {/* 채팅 메시지 */}
        {messages.map((item) => {
          const isUser = item.role === 'user'

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isUser
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-surface-muted text-primary-700'
                }`}
              >
                {isUser ? (
                  <UserRound size={17} />
                ) : (
                  <Bot size={18} />
                )}
              </div>

              <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'rounded-tr-sm bg-primary-100'
                    : 'rounded-tl-sm bg-surface-muted'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[13px] leading-6 text-ink">
                  {item.content}
                </p>

                {/* 참고 자료 */}
                {!isUser && item.sources.length > 0 && (
                  <div className="mt-3 border-t border-primary-100 pt-3">
                    <p className="mb-2 text-[11px] font-semibold text-ink-muted">
                      참고 자료
                    </p>

                    <div className="flex flex-col gap-1.5">
                      {item.sources.map((source, index) =>
                        source.url?.startsWith('https://') ||
                        source.url?.startsWith('http://') ? (
                          <a
                            key={`${source.type}-${source.id}-${index}`}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary-700 underline underline-offset-2"
                          >
                            {source.title}
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span
                            key={`${source.type}-${source.id}-${index}`}
                            className="text-[11px] text-ink-muted"
                          >
                            {source.title}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 응답 대기 */}
        {loading && (
          <div
            role="status"
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
              <Bot size={18} />
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-[12px] text-ink-muted">
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
              답변을 작성하고 있습니다...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 오류 */}
      {error && (
        <p
          role="alert"
          className="shrink-0 border-t border-red-100 bg-red-50 px-5 py-3 text-[12px] text-red-600"
        >
          {error}
        </p>
      )}

      {/* 입력 영역 */}
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="shrink-0 border-t border-primary-100 bg-white px-4 py-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-primary-200 p-2 focus-within:border-primary-400">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 점을 입력하세요..."
            aria-label="AI에게 질문하기"
            maxLength={4000}
            rows={2}
            disabled={loading}
            className="max-h-32 min-h-[48px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] leading-6 text-ink outline-none placeholder:text-ink-muted disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="질문 전송"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] leading-5 text-ink-muted">
          AI 답변은 참고용이며, 최신 법령과 정책은
          공식 자료에서 확인해 주세요.
        </p>
      </form>
    </section>
  )
}
