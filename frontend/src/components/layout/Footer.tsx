
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-primary-100 bg-surface-cream">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <Link
              to="/"
              aria-label="MOA 홈으로 이동"
              className="inline-flex items-center"
            >
              <img
                src="/images/logo/moa_logo.png"
                alt="MOA"
                className="h-[42px] w-auto max-w-[145px] object-contain"
              />
            </Link>

            <p className="mt-4 text-[13px] leading-6 text-ink-secondary">
              사회 초년생을 위한 AI 생활 금융 가이드
              <br />
              복잡한 금융 정보도 쉽고 친근하게.
            </p>
          </div>

          <nav
            aria-label="푸터 메뉴"
            className="flex flex-wrap items-start gap-x-7 gap-y-3 text-[13px] font-medium text-ink-secondary"
          >
            <Link to="/" className="hover:text-primary-700">
              홈
            </Link>

            <Link to="/guides" className="hover:text-primary-700">
              금융 가이드
            </Link>

            <Link to="/calculator" className="hover:text-primary-700">
              급여 계산기
            </Link>

            <Link to="/ai" className="hover:text-primary-700">
              AI Q&A
            </Link>

            <Link to="/quiz" className="hover:text-primary-700">
              퀴즈
            </Link>
          </nav>
        </div>

        <div className="mt-9 border-t border-primary-100 pt-5">
          <p className="text-[12px] leading-5 text-ink-muted">
            MOA에서 제공하는 금융 및 근로 정보와 계산 결과는
            참고용이며, 실제 적용 기준과 다를 수 있습니다.
          </p>

          <p className="mt-2 text-[12px] text-ink-muted">
            © 2026 MOA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
