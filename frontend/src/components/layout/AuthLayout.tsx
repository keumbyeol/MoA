import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* 전체 배경 이미지 */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage:
            "url('/images/background/moa_StartScreen.png')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* 왼쪽 소개 영역 */}
     
{/* 왼쪽 소개 영역 */}
<div
  className="absolute left-[11%] top-[18%] z-10 hidden flex-col items-start lg:flex"
  style={{
    fontFamily: 'Pretendard, sans-serif',
  }}
>
  <h1
    style={{
      fontFamily: 'Jalnan, Pretendard, sans-serif',
      fontSize: 'clamp(48px, 4vw, 72px)',
      fontWeight: 400,
      lineHeight: 1.15,
      color: '#A2CE91',

      // 두껍고 부드러운 초록색 테두리
      WebkitTextStroke: '3px #638D50',
      paintOrder: 'stroke fill',
      strokeLinejoin: 'round',
    }}
  >
    MoA
  </h1>

  <p
    className="mt-4 font-semibold leading-relaxed"
    style={{
      fontSize: 'clamp(15px, 1.1vw, 20px)',
      color: '#527B3D',
    }}
  >
    사회 초년생을 위한
    <br />
    AI 생활 금융 가이드
  </p>
</div>


      {/* 오른쪽 로그인 / 회원가입 영역 */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-10 lg:ml-auto lg:w-[39%] lg:px-10">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </main>
  )
}