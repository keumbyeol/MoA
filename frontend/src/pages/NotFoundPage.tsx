
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, House } from 'lucide-react'

function Sprout({
  className = '',
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 103C50 76 48 56 50 30"
        stroke="#A8C979"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M49 75C30 68 22 55 17 40"
        stroke="#A8C979"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M51 63C67 57 76 45 80 29"
        stroke="#A8C979"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse
        cx="26"
        cy="35"
        rx="13"
        ry="22"
        transform="rotate(-40 26 35)"
        fill="#D1E6AB"
      />
      <ellipse
        cx="74"
        cy="25"
        rx="13"
        ry="22"
        transform="rotate(38 74 25)"
        fill="#C5DE97"
      />
      <ellipse
        cx="19"
        cy="63"
        rx="10"
        ry="17"
        transform="rotate(-45 19 63)"
        fill="#D9EAB9"
      />
      <ellipse
        cx="80"
        cy="53"
        rx="10"
        ry="17"
        transform="rotate(45 80 53)"
        fill="#D5E7AE"
      />
    </svg>
  )
}

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden bg-[#FFFEFA] px-5 py-20">
      {/* 중앙 콘텐츠 */}
      <div className="relative z-10 flex -translate-y-8 flex-col items-center text-center">
        {/* 404 구름 */}
        <div className="relative flex h-48 w-80 items-center justify-center sm:h-56 sm:w-[420px]">
          <svg
            viewBox="0 0 420 230"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="moa-cloud"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#EDF5D9" />
                <stop offset="100%" stopColor="#F9FBEF" />
              </linearGradient>
            </defs>

            <path
              d="M22 199C10 177 19 139 48 125C62 118 75 118 88 121C83 88 103 56 135 54C146 53 159 56 168 63C184 28 222 13 258 28C283 38 297 58 301 79C316 64 344 63 362 78C378 91 381 109 377 125C401 131 415 151 412 174C410 184 406 192 400 199Z"
              fill="url(#moa-cloud)"
            />
          </svg>

          <span className="relative z-10 mt-8 font-display text-[100px] font-extrabold leading-none tracking-tight text-[#91BE50] sm:text-[128px]">
            404
          </span>

          {/* 작은 잎 장식 */}
          <svg
            className="absolute left-6 top-5 h-9 w-9 -rotate-12 sm:left-10"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <path
              d="M5 31C7 13 20 5 35 7C34 24 22 32 5 31Z"
              fill="#C5DF96"
            />
            <path
              d="M5 31L29 13"
              stroke="#B2D27D"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <svg
            className="absolute right-2 top-20 h-6 w-6 rotate-12"
            viewBox="0 0 30 30"
            aria-hidden="true"
          >
            <path
              d="M5 5C20 5 26 15 24 25C10 24 4 16 5 5Z"
              fill="#D4E8B0"
            />
          </svg>
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#2E4228] sm:text-3xl">
          요청하신 페이지를 찾을 수 없어요.
        </h1>

        <p className="mt-3 text-sm leading-7 text-[#7B8175] sm:text-base">
          주소가 잘못되었거나, 삭제되었을 수 있습니다.
        </p>

        {/* 이동 버튼 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-[#94BD54] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#82AA45]"
          >
            <House size={17} />
            홈으로 돌아가기
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full border border-[#C6DFA3] bg-white px-6 py-3 text-sm font-semibold text-[#719849] transition-colors hover:bg-[#F3F9E9]"
          >
            <ArrowLeft size={17} />
            이전 페이지로
          </button>
        </div>
      </div>

      {/* 하단 언덕 배경 */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-36 w-full sm:h-48"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 100C200 50 380 170 610 165C850 160 1000 85 1180 105C1300 120 1380 95 1440 60V220H0Z"
          fill="#F0F6DE"
        />
        <path
          d="M0 135C220 105 340 205 560 195C760 185 950 115 1130 155C1260 185 1370 145 1440 125V220H0Z"
          fill="#E4F0CA"
        />
        <path
          d="M0 175C190 145 300 220 520 218C750 215 950 170 1140 190C1270 205 1360 180 1440 160V220H0Z"
          fill="#D6E8B2"
        />
      </svg>

      {/* 좌측 새싹 */}
      <Sprout className="pointer-events-none absolute bottom-9 left-[3%] h-24 w-24 -rotate-12 opacity-90 sm:bottom-14 sm:left-[8%] sm:h-32 sm:w-32" />

      <Sprout className="pointer-events-none absolute bottom-5 left-[18%] h-12 w-12 rotate-12 opacity-60 sm:h-16 sm:w-16" />

      {/* 우측 새싹 */}
      <Sprout className="pointer-events-none absolute bottom-8 right-[5%] h-24 w-24 rotate-12 opacity-90 sm:bottom-12 sm:right-[9%] sm:h-32 sm:w-32" />

      <Sprout className="pointer-events-none absolute bottom-3 right-[21%] h-12 w-12 -rotate-12 opacity-60 sm:h-16 sm:w-16" />
    </main>
  )
}
