
import { useState, type CSSProperties, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'

import AuthLayout from '../components/layout/AuthLayout'
import { message } from '../components/common/Message'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const inputStyle: CSSProperties = {
  width: '100%',
  height: '50px',
  paddingLeft: '44px',
  paddingRight: '44px',
  border: '1px solid var(--color-line-strong)',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: 'var(--color-ink)',
  fontFamily: 'Pretendard, sans-serif',
  fontSize: '14px',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const redirectPath =
    (location.state as {
      from?: { pathname?: string }
    } | null)?.from?.pathname ?? '/calculator'

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/calculator" replace />
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      message.warning('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      await login({
        email: email.trim(),
        password,
      })

      message.success('로그인되었습니다.')
      navigate(redirectPath, { replace: true })
    } catch (error) {
      message.error(
        getApiErrorMessage(error, '로그인에 실패했습니다.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div
        className="mx-auto w-full max-w-[420px]"
        style={{ fontFamily: 'Pretendard, sans-serif' }}
      >
        {/* 잘난체 MoA 타이틀 */}
        <h1
          className="mb-10 text-center leading-none"
          style={{
            fontFamily: 'Jalnan, Pretendard, sans-serif',
            fontSize: 'clamp(48px, 4vw, 64px)',
            fontWeight: 400,
            color: 'var(--color-primary-400)',
          }}
        >
          MoA
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            {/* 이메일 */}
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-ink-secondary)' }}
              />

              <input
                type="email"
                name="email"
                placeholder="이메일을 입력해 주세요"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={inputStyle}
                className="placeholder:text-ink-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-ink-secondary)' }}
              />

              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
                className="placeholder:text-ink-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <span className="text-xs text-ink-secondary">
              비밀번호 찾기
            </span>
          </div>

          {/* 연두색 로그인 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex h-[50px] w-full items-center justify-center rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-primary-500)',
              color: '#ffffff',
              fontFamily: 'Pretendard, sans-serif',
            }}
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 이동 */}
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <span className="text-ink-muted">
            계정이 없으신가요?
          </span>

          <Link
            to="/signup"
            className="font-semibold text-primary-600 hover:underline"
          >
            회원가입하기 &gt;
          </Link>
        </div>

        {/* 비회원 이동: 메인 화면 구현 후 연결 */}
        <div className="mt-24 text-center">
          <span className="text-xs text-ink-muted">
            비회원으로 둘러보기 &gt;
          </span>
        </div>
      </div>
    </AuthLayout>
  )
}
