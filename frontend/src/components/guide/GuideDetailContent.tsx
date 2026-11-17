import { useState } from 'react'

import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Info,
  Scale,
} from 'lucide-react'

import type {
  GuideDetail,
  GuideLawArticle,
} from '../../types/guide'


interface GuideDetailContentProps {
  guide: GuideDetail
}


export default function GuideDetailContent({
  guide,
}: GuideDetailContentProps) {
  const [showLaw, setShowLaw] = useState(false)

  const isTopic = guide.kind === 'topic'

  const sections = guide.sections ?? []
  const lawArticles = guide.law_articles ?? []

  const hasSections =
    isTopic && sections.length > 0

  return (
    <div className="space-y-8">

      {/* ============================= */}
      {/* 핵심 요약 */}
      {/* ============================= */}

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


      {/* ============================= */}
      {/* 자세히 알아보기 */}
      {/* ============================= */}

      <section>

        <div className="mb-6 flex items-center gap-2">
          <BookOpen
            size={19}
            className="text-primary-dark"
          />

          <h2 className="text-lg font-bold text-ink">
            {isTopic
              ? '자세히 알아보기'
              : '지원정책 상세 정보'}
          </h2>
        </div>

        {hasSections ? (

          <div className="space-y-7">

            {sections.map((section, index) => (
              <div
                key={`${index}-${section.title}`}
                className="border-b border-line pb-6 last:border-0"
              >

                <h3 className="mb-3 text-base font-bold text-ink">

                  <span className="mr-2 text-primary-dark">
                    {index + 1}.
                  </span>

                  {section.title}

                </h3>

                <p className="whitespace-pre-wrap break-words text-sm leading-8 text-ink-secondary">
                  {section.body}
                </p>

              </div>
            ))}

          </div>

        ) : (

          <div className="whitespace-pre-wrap break-words text-sm leading-8 text-ink-secondary">
            {guide.body}
          </div>

        )}

      </section>


      {/* ============================= */}
      {/* 관련 법령 */}
      {/* ============================= */}

      {isTopic && lawArticles.length > 0 && (

        <section className="border-t border-line pt-7">

          <div className="mb-4 flex items-center gap-2">

            <Scale
              size={19}
              className="text-primary-dark"
            />

            <h2 className="text-base font-bold text-ink">
              관련 법령
            </h2>

          </div>

          <p className="mb-4 text-xs leading-6 text-ink-muted">
            아래는 저장된 법령에서 주제와 관련된
            조문 제목으로 검색한 결과입니다.
            실제 적용 기준은 조문 전체와 최신 법령을
            함께 확인해 주세요.
          </p>

          <div className="space-y-3">

            {lawArticles.map((article) => (
              <LawArticleCard
                key={article.id}
                article={article}
              />
            ))}

          </div>


          {/* 법령 원문 펼치기 버튼 */}

          <button
            type="button"
            onClick={() => {
              setShowLaw((prev) => !prev)
            }}
            aria-expanded={showLaw}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary hover:text-primary-dark"
          >

            {showLaw
              ? '법령 원문 접기'
              : '관련 법령 원문 펼쳐보기'}

            <ChevronDown
              size={15}
              className={`transition-transform ${
                showLaw ? 'rotate-180' : ''
              }`}
            />

          </button>


          {/* 펼쳤을 때 실제 법령 원문 표시 */}

          {showLaw && (

            <div className="mt-4 space-y-4">

              {lawArticles.map((article) => (

                <div
                  key={article.id}
                  className="rounded-xl bg-surface-muted p-5"
                >

                  <h3 className="mb-3 text-sm font-bold text-ink">
                    제{article.article_no}조
                    {article.heading
                      ? ` ${article.heading}`
                      : ''}
                  </h3>

                  <p className="whitespace-pre-wrap break-words text-xs leading-7 text-ink-secondary">
                    {article.official_text}
                  </p>

                </div>

              ))}

            </div>

          )}

        </section>

      )}


      {/* ============================= */}
      {/* 관련 법령 및 공식 출처 */}
      {/* ============================= */}

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


      {/* ============================= */}
      {/* 안내 및 주의 문구 */}
      {/* ============================= */}

      <div className="flex items-start gap-2 rounded-xl bg-surface-muted p-4">

        <Info
          size={17}
          className="mt-0.5 shrink-0 text-ink-muted"
        />

        <p className="text-xs leading-6 text-ink-muted">
          본 내용은 법령과 제도를 쉽게 이해할 수 있도록
          작성한 일반 안내입니다. 개인별 적용 여부는
          근로조건과 최신 법령 등에 따라 달라질 수
          있으므로 공식 기관의 안내를 확인해 주세요.
          수집된 법령 원문은 일부 항목이 생략되어
          있을 수 있습니다.
        </p>

      </div>

    </div>
  )
}


// ==========================================
// 법령 조문 카드
// ==========================================

interface LawArticleCardProps {
  article: GuideLawArticle
}

function LawArticleCard({
  article,
}: LawArticleCardProps) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
          <Scale
            size={16}
            className="text-primary-dark"
          />
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="text-sm font-semibold text-ink">
            제{article.article_no}조
            {article.heading
              ? ` ${article.heading}`
              : ''}
          </h3>

          <p className="mt-1 text-xs text-ink-muted">
            관련 법령 조문
          </p>

        </div>

      </div>

    </div>
  )
}