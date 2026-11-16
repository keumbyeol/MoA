
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react'

import type { GuideDetail } from '../../types/guide'

interface GuideDetailContentProps {
  guide: GuideDetail
}

export default function GuideDetailContent({
  guide,
}: GuideDetailContentProps) {
  return (
    <div className="space-y-7">
      <section className="rounded-card bg-gradient-to-br from-primary-50 to-warning-soft p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2
            size={18}
            className="text-primary-dark"
          />

          <h2 className="text-base font-bold text-ink">
            핵심 요약
          </h2>
        </div>

        <p className="text-sm leading-7 text-ink-secondary">
          {guide.summary}
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <BookOpen
            size={19}
            className="text-primary-dark"
          />

          <h2 className="text-lg font-bold text-ink">
            자세히 알아보기
          </h2>
        </div>

        <div className="whitespace-pre-wrap break-words text-sm leading-8 text-ink-secondary">
          {guide.body}
        </div>
      </section>

      {guide.references.length > 0 && (
        <section className="border-t border-line pt-6">
          <h2 className="mb-4 text-base font-bold text-ink">
            관련 법령 및 공식 출처
          </h2>

          <div className="space-y-2">
            {guide.references.map((reference) => (
              <a
                key={reference.id}
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-primary"
              >
                <span className="min-w-0 text-sm text-ink-secondary">
                  {reference.title}
                </span>

                <ExternalLink
                  size={15}
                  className="shrink-0 text-primary-dark"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-surface-muted p-4">
        <Info
          size={17}
          className="mt-0.5 shrink-0 text-ink-muted"
        />

        <p className="text-xs leading-6 text-ink-muted">
          본 정보는 이해를 돕기 위한 참고 자료입니다.
          실제 적용 여부와 금액은 개인 상황 및 최신 법령에
          따라 달라질 수 있으므로 공식 기관의 안내를
          확인해 주세요.
        </p>
      </div>
    </div>
  )
}
