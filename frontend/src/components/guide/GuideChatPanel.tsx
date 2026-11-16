
import {
  Bot,
  LockKeyhole,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react'

interface GuideChatPanelProps {
  guideTitle: string
}

const SUGGESTED_QUESTIONS = [
  '이 내용을 더 쉽게 설명해 주세요.',
  '실제 사례를 알려주세요.',
  '관련해서 알아두면 좋은 정보는?',
]

export default function GuideChatPanel({
  guideTitle,
}: GuideChatPanelProps) {
  return (
    <aside className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
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
        <div className="flex items-start gap-2">
          <img
            src="/images/mascot/moa_cha_book1.png"
            alt=""
            className="h-9 w-9 shrink-0 object-contain"
          />

          <div className="rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
            <p className="text-xs leading-6 text-ink-secondary">
              안녕하세요!
              <br />
              <strong>{guideTitle}</strong>에 대해
              궁금한 점이 있으신가요?
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle
              size={16}
              className="text-primary-dark"
            />

            <h3 className="text-xs font-bold text-primary-800">
              이런 질문도 할 수 있어요
            </h3>
          </div>

          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <div
                key={question}
                className="rounded-lg bg-surface px-3 py-2.5 text-xs text-ink-secondary"
              >
                {question}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
          <LockKeyhole
            size={17}
            className="shrink-0 text-ink-muted"
          />

          <p className="text-xs leading-5 text-ink-muted">
            AI 챗봇 기능은 추후 제공될 예정입니다.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-surface-muted px-4 py-3">
          <Bot
            size={17}
            className="text-ink-muted"
          />

          <input
            type="text"
            disabled
            placeholder="궁금한 내용을 입력해 보세요."
            aria-label="AI 챗봇 질문 입력"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-ink-muted"
          />

          <button
            type="button"
            disabled
            aria-label="질문 보내기"
            className="text-ink-muted opacity-50"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </aside>
  )
}
