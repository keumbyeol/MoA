
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

import AuthLayout from '../components/layout/AuthLayout'
import { message } from '../components/common/Message'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import type { UserType } from '../api/auth'

type SignupStep = 1 | 2 | 3

const userTypes: {
  value: UserType
  label: string
}[] = [
  { value: 'FIRST_JOB', label: '사회초년생 · 첫 취업' },
  { value: 'PART_TIME', label: '아르바이트 · 첫 근로' },
  { value: 'FOREIGN_WORKER', label: '외국인 근로자' },
  { value: 'RETURNING', label: '재취업 준비' },
  { value: 'OTHER', label: '기타' },
]

const steps: { number: SignupStep; label: string }[] = [
  { number: 1, label: '정보 입력' },
  { number: 2, label: '추가 정보' },
  { number: 3, label: '가입 완료' },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isAuthenticated, isLoading } = useAuth()

  const [step, setStep] = useState<SignupStep>(1)

  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] =
    useState(false)

  const [userType, setUserType] = useState<UserType>('OTHER')
  const [agreeAll, setAgreeAll] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const inputClass =
    'h-[48px] w-full rounded-lg border border-[#C9DDB8] ' +
    'bg-transparent pl-11 pr-11 text-[13px] text-[#344332] ' +
    'outline-none transition-colors ' +
    'placeholder:text-[#9DA99A] ' +
    'focus:border-[#91B969] focus:ring-2 focus:ring-[#91B969]/15'

  const iconClass =
    'pointer-events-none absolute left-4 top-1/2 ' +
    '-translate-y-1/2 text-[#7B8977]'

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked)
    setAgreeTerms(checked)
    setAgreePrivacy(checked)
  }

  const handleAgreement = (
    kind: 'terms' | 'privacy',
    checked: boolean,
  ) => {
    const nextTerms = kind === 'terms' ? checked : agreeTerms
    const nextPrivacy =
      kind === 'privacy' ? checked : agreePrivacy

    setAgreeTerms(nextTerms)
    setAgreePrivacy(nextPrivacy)
    setAgreeAll(nextTerms && nextPrivacy)
  }

  const handleNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (nickname.trim().length < 2) {
      message.warning('닉네임은 2자 이상 입력해 주세요.')
      return
    }

    if (password.length < 8) {
      message.warning('비밀번호는 8자 이상 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      message.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!agreeTerms || !agreePrivacy) {
      message.warning('필수 항목에 동의해 주세요.')
      return
    }

    setStep(2)
  }

  const handleSignup = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await signup({
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        user_type: userType,
      })

      setStep(3)
      message.success('회원가입이 완료되었습니다.')
    } catch (error) {
      message.error(
        getApiErrorMessage(error, '회원가입에 실패했습니다.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/calculator" replace />
  }

  return (
    <AuthLayout>
      <div
        className="mx-auto w-full max-w-[420px]"
        style={{ fontFamily: 'Pretendard, sans-serif' }}
      >
        {/* MoA 타이틀 */}
        <h1
          className="mb-5 text-center leading-none"
          style={{
            fontFamily: 'Jalnan, Pretendard, sans-serif',
            fontSize: 'clamp(48px, 4vw, 64px)',
            fontWeight: 400,
            color: '#A2CE91',
          }}
        >
          MoA
        </h1>

        {/* 회원가입 진행 단계 */}
        <div className="mb-7 flex items-start justify-center gap-4">
          {steps.map((item, index) => {
            const active = step === item.number
            const completed = step > item.number

            return (
              <div
                key={item.number}
                className="flex items-start gap-4"
              >
                <div className="flex min-w-[66px] flex-col items-center gap-1.5">
                  <div
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                      active || completed
                        ? 'bg-[#91B969] text-white'
                        : 'bg-[#D9D9D9] text-white',
                    ].join(' ')}
                  >
                    {completed ? (
                      <Check size={15} strokeWidth={2.5} />
                    ) : (
                      item.number
                    )}
                  </div>

                  <span
                    className={[
                      'text-[11px]',
                      active
                        ? 'font-semibold text-[#739A53]'
                        : 'text-[#A6AAA4]',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="mt-3 h-px w-6 bg-[#DDE5D6]" />
                )}
              </div>
            )
          })}
        </div>

        {/* 1단계: 정보 입력 */}
        {step === 1 && (
          <form onSubmit={handleNext}>
            <div className="space-y-3">
              <div className="relative">
                <UserRound size={17} className={iconClass} />

                <input
                  type="text"
                  name="nickname"
                  placeholder="이름 또는 닉네임을 입력해 주세요"
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(event) =>
                    setNickname(event.target.value)
                  }
                  className={inputClass}
                  maxLength={60}
                  required
                />
              </div>

              <div className="relative">
                <Mail size={17} className={iconClass} />

                <input
                  type="email"
                  name="email"
                  placeholder="이메일을 입력해 주세요"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="relative">
                <LockKeyhole size={17} className={iconClass} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="비밀번호를 입력해 주세요 (8자 이상)"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className={inputClass}
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8977]"
                  aria-label={
                    showPassword
                      ? '비밀번호 숨기기'
                      : '비밀번호 보기'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <div className="relative">
                <LockKeyhole size={17} className={iconClass} />

                <input
                  type={
                    showPasswordConfirm ? 'text' : 'password'
                  }
                  name="passwordConfirm"
                  placeholder="비밀번호를 다시 입력해 주세요"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(event.target.value)
                  }
                  className={inputClass}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirm((previous) => !previous)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8977]"
                  aria-label={
                    showPasswordConfirm
                      ? '비밀번호 숨기기'
                      : '비밀번호 보기'
                  }
                >
                  {showPasswordConfirm ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="mt-5 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#344332]">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(event) =>
                    handleAgreeAll(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#91B969]"
                />
                전체 동의하기
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#8D9988]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) =>
                    handleAgreement(
                      'terms',
                      event.target.checked,
                    )
                  }
                  className="h-3.5 w-3.5 accent-[#91B969]"
                />
                <span className="flex-1">
                  [필수] 이용약관에 동의합니다.
                </span>
                <ChevronRight size={14} />
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#8D9988]">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(event) =>
                    handleAgreement(
                      'privacy',
                      event.target.checked,
                    )
                  }
                  className="h-3.5 w-3.5 accent-[#91B969]"
                />
                <span className="flex-1">
                  [필수] 개인정보 수집 및 이용에 동의합니다.
                </span>
                <ChevronRight size={14} />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 flex h-[48px] w-full items-center justify-center rounded-lg bg-[#91B969] text-[14px] font-semibold text-white transition-colors hover:bg-[#82AA5C]"
            >
              다음
            </button>
          </form>
        )}

        {/* 2단계: 추가 정보 */}
        {step === 2 && (
          <form onSubmit={handleSignup}>
            <div className="mb-6 text-center">
              <h2 className="text-[17px] font-semibold text-[#344332]">
                어떤 정보가 가장 필요하신가요?
              </h2>
              <p className="mt-2 text-[12px] text-[#8D9988]">
                관심 분야에 맞는 정보를 안내해 드릴게요.
              </p>
            </div>

            <div className="space-y-2">
              {userTypes.map((type) => (
                <label
                  key={type.value}
                  className={[
                    'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3.5 transition-colors',
                    userType === type.value
                      ? 'border-[#91B969] bg-[#F1F7E9]'
                      : 'border-[#D7E4CB] bg-transparent hover:bg-[#F8FAF5]',
                  ].join(' ')}
                >
                  <span className="text-[13px] text-[#344332]">
                    {type.label}
                  </span>

                  <input
                    type="radio"
                    name="userType"
                    value={type.value}
                    checked={userType === type.value}
                    onChange={() => setUserType(type.value)}
                    className="h-4 w-4 accent-[#91B969]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-[48px] flex-1 rounded-lg border border-[#C9DDB8] text-[13px] font-semibold text-[#739A53]"
              >
                이전
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="h-[48px] flex-[2] rounded-lg bg-[#91B969] text-[13px] font-semibold text-white hover:bg-[#82AA5C] disabled:opacity-60"
              >
                {submitting ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </form>
        )}

        {/* 3단계: 가입 완료 */}
        {step === 3 && (
          <div className="flex flex-col items-center py-5 text-center">
            <CircleCheck
              size={66}
              strokeWidth={1.5}
              className="text-[#91B969]"
            />

            <h2 className="mt-5 text-[20px] font-semibold text-[#344332]">
              회원가입이 완료되었습니다!
            </h2>

            <p className="mt-3 text-[13px] leading-relaxed text-[#8D9988]">
              이제 모아와 함께
              <br />
              필요한 금융 정보를 확인해 보세요.
            </p>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="mt-8 h-[48px] w-full rounded-lg bg-[#91B969] text-[14px] font-semibold text-white hover:bg-[#82AA5C]"
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {/* 로그인 페이지 이동 */}
        {step !== 3 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-[12px]">
            <span className="text-[#9AA596]">
              이미 계정이 있으신가요?
            </span>

            <Link
              to="/login"
              className="font-semibold text-[#739A53] hover:underline"
            >
              로그인하기 &gt;
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
