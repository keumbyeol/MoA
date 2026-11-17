
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react'

import { useGuides } from '../hooks/useGuides'

import type { Guide } from '../types/guide'

// 페이지 이동 경로
const PATHS = {
  guides: '/guides',
  calculator: '/calculator',
  quiz: '/quiz',
}

// 이미지 경로
const IMAGES = {
  hero: '/images/mascot/moa_calcul_car.png',
  guide: '/images/icons/compass.png',
  calculator: '/images/icons/calculator.png',
  bubble: '/images/icons/bubble.png',
  mascot: '/images/mascot/moa_car1.png',
  mascot2: '/images/mascot/moa_car2.png',
  book: '/images/mascot/moa_cha_book1.png',
  coin: '/images/mascot/moa_cha_coin.png',
}

// 금융 가이드 카드별 이미지
const GUIDE_IMAGES = [
  IMAGES.book,
  IMAGES.coin,
  IMAGES.mascot,
]

// 가이드 카드
function HomeGuideCard({
  guide,
  index,
}: {
  guide: Guide
  index: number
}) {
  return (
    <Link
      to={`/guides/${encodeURIComponent(guide.id)}`}
      className="group flex min-h-[190px] items-center gap-3 rounded-card border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
    >
      <div className="min-w-0 flex-1">
        {/* 카테고리 */}
        <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-dark">
          {guide.category.name}
        </span>

        {/* 제목 */}
        <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-ink">
          {guide.title}
        </h3>

        {/* 설명 */}
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-secondary">
          {guide.summary}
        </p>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-dark">
          자세히 보기

          <ChevronRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>

      <img
        src={GUIDE_IMAGES[index % GUIDE_IMAGES.length]}
        alt=""
        className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24"
      />
    </Link>
  )
}

export default function HomePage() {
  // 기존 금융 가이드 API 재사용
  const {
    data,
    isPending,
    isError,
    refetch,
  } = useGuides({
    page: 1,
    size: 3,
    sort: 'latest',
  })

  const featuredGuides = data?.items ?? []

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">

        {/* =========================
            1. 메인 배너
        ========================= */}
        <section className="relative overflow-hidden rounded-3xl bg-primary-100 px-7 pb-0 pt-10 sm:px-12 lg:min-h-[350px] lg:px-14">
          <div className="relative z-10 max-w-xl pb-6 lg:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary-800">
              <Sparkles size={13} />
              사회초년생을 위한 금융 가이드
            </span>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              처음 시작하는 내 돈 이야기,
              <br />

              <span className="text-primary-dark">
                MOA와 함께 차근차근!
              </span>
            </h1>

            <p className="mt-5 text-sm leading-7 text-ink-secondary sm:text-base">
              복잡한 급여, 세금, 사회보험 정보부터
              <br className="hidden sm:block" />
              알아두면 좋은 금융 상식까지.
              <br />
              모아가 쉽고 친절하게 안내해 드릴게요.
            </p>

            <Link
              to={PATHS.guides}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-600"
            >
              금융정보 둘러보기
              <ArrowRight size={17} />
            </Link>
          </div>

          <img
            src={IMAGES.hero}
            alt="금융정보를 안내하는 모아 캐릭터"
            className="relative z-0 mx-auto w-full max-w-[480px] object-contain lg:absolute lg:bottom-0 lg:right-3 lg:w-[48%] lg:max-w-[580px]"
          />
        </section>

        {/* =========================
            2. 주요 기능 바로가기
        ========================= */}
        <section
          aria-label="주요 기능"
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {/* 금융 가이드 */}
          <Link
            to={PATHS.guides}
            className="group flex min-h-32 items-center gap-4 rounded-card border border-primary-100 bg-primary-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
          >
            <img
              src={IMAGES.guide}
              alt=""
              className="h-20 w-20 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink">
                금융정보 가이드
              </h2>

              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                꼭 알아야 할 금융정보를
                <br />
                쉽게 확인해 보세요.
              </p>

              <ChevronRight
                size={16}
                className="mt-2 text-primary-dark transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* 급여 계산기 */}
          <Link
            to={PATHS.calculator}
            className="group flex min-h-32 items-center gap-4 rounded-card border border-line bg-[#FFF8E8] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
          >
            <img
              src={IMAGES.calculator}
              alt=""
              className="h-20 w-20 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink">
                급여 계산기
              </h2>

              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                내 급여와 수당을
                <br />
                간편하게 계산해 보세요.
              </p>

              <ChevronRight
                size={16}
                className="mt-2 text-primary-dark transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          {/* 금융 퀴즈 - bubble.png 적용 */}
          <Link
            to={PATHS.quiz}
            className="group flex min-h-32 items-center gap-4 rounded-card border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
          >
            <img
              src={IMAGES.bubble}
              alt=""
              className="h-20 w-20 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink">
                금융 퀴즈
              </h2>

              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                퀴즈를 풀면서
                <br />
                금융 상식을 익혀보세요.
              </p>

              <ChevronRight
                size={16}
                className="mt-2 text-primary-dark transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        </section>

        {/* =========================
            3. 금융정보 둘러보기
        ========================= */}
        <section className="rounded-3xl bg-primary-50/50 p-5 sm:p-7">
          {/* 섹션 제목 */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen
                  size={21}
                  className="text-primary-dark"
                />

                <h2 className="text-xl font-extrabold text-ink">
                  금융정보 둘러보기
                </h2>
              </div>

              <p className="mt-2 text-xs text-ink-secondary">
                사회초년생이 알아두면 좋은 금융정보
              </p>
            </div>

            <Link
              to={PATHS.guides}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-dark hover:underline"
            >
              전체 보기
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* 로딩 */}
          {isPending ? (
            <div
              role="status"
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-card bg-surface-muted"
                />
              ))}

              <span className="sr-only">
                금융정보를 불러오는 중입니다.
              </span>
            </div>
          ) : isError ? (
            /* API 오류 */
            <div className="rounded-card border border-line bg-surface px-5 py-8 text-center">
              <p className="text-sm text-ink-secondary">
                금융정보를 불러오지 못했습니다.
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-xs font-bold text-primary-dark hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : featuredGuides.length === 0 ? (
            /* 데이터 없음 */
            <div className="rounded-card border border-line bg-surface px-5 py-8 text-center">
              <p className="text-sm text-ink-secondary">
                표시할 금융정보가 없습니다.
              </p>
            </div>
          ) : (
            /* 금융정보 카드 */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {featuredGuides.map((guide, index) => (
                <HomeGuideCard
                  key={guide.id}
                  guide={guide}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        {/* =========================
            4. 금융 퀴즈 배너
        ========================= */}
        <section className="relative flex flex-col items-center justify-between gap-5 overflow-hidden rounded-3xl bg-[#FFF8DC] px-7 py-7 sm:flex-row sm:px-10">
          <div className="flex items-center gap-5">
            <img
              src={IMAGES.mascot2}
              alt=""
              className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
            />

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-dark">
                <ClipboardList size={15} />
                QUIZ
              </div>

              <h2 className="mt-2 text-lg font-extrabold text-ink sm:text-xl">
                오늘 배운 금융 상식,
                <br />
                퀴즈로 확인해 볼까요?
              </h2>

              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                가볍게 풀어보며 금융 지식을 쌓아보세요.
              </p>
            </div>
          </div>

          <Link
            to={PATHS.quiz}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FFE38A] px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-[#FFD96B]"
          >
            퀴즈 풀기
            <ArrowRight size={17} />
          </Link>
        </section>

        {/* =========================
            5. 하단 안내 문구
        ========================= */}
        <p className="pb-4 text-center text-xs leading-6 text-ink-muted">
          MOA에서 제공하는 금융정보는 참고용이며,
          실제 적용 조건은 공식 기관에서 확인해 주세요.
        </p>
      </div>
    </main>
  )
}
