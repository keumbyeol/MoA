
import { useEffect, useState } from 'react'
import {
  X,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react'

import type { User, UserType } from '../../api/auth'
import { authApi } from '../../api/auth'
import { getApiErrorMessage } from '../../api/client'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUpdated: (user: User) => void
}

const USER_TYPES: {
  value: UserType
  label: string
}[] = [
  { value: 'FIRST_JOB', label: '사회초년생' },
  { value: 'PART_TIME', label: '아르바이트' },
  { value: 'FOREIGN_WORKER', label: '외국인 근로자' },
  { value: 'RETURNING', label: '재취업 준비' },
  { value: 'OTHER', label: '일반회원' },
]

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: ProfileSettingsModalProps) {
  const [nickname, setNickname] = useState(user.nickname)
  const [userType, setUserType] = useState<UserType>(
    user.user_type,
  )

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 모달을 열 때 현재 회원 정보로 초기화
  useEffect(() => {
    if (!isOpen) return

    setNickname(user.nickname)
    setUserType(user.user_type)

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')

    setShowPassword(false)
    setError('')
    setSuccess('')
  }, [isOpen, user])

  if (!isOpen) return null

  const hasProfileChanges =
    nickname.trim() !== user.nickname ||
    userType !== user.user_type

  const hasPasswordInput =
    currentPassword !== '' ||
    newPassword !== '' ||
    confirmPassword !== ''

  const handleSave = async () => {
    if (isSaving) return

    setError('')
    setSuccess('')

    const trimmedNickname = nickname.trim()

    if (trimmedNickname.length < 2) {
      setError('닉네임은 2자 이상 입력해 주세요.')
      return
    }

    if (trimmedNickname.length > 60) {
      setError('닉네임은 60자 이하로 입력해 주세요.')
      return
    }

    if (hasPasswordInput) {
      if (!currentPassword) {
        setError('현재 비밀번호를 입력해 주세요.')
        return
      }

      if (newPassword.length < 8) {
        setError('새 비밀번호는 8자 이상 입력해 주세요.')
        return
      }

      if (newPassword.length > 128) {
        setError('새 비밀번호는 128자 이하로 입력해 주세요.')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.')
        return
      }
    }

    if (!hasProfileChanges && !hasPasswordInput) {
      setError('변경된 정보가 없습니다.')
      return
    }

    setIsSaving(true)

    try {
      // 회원 정보 수정
      if (hasProfileChanges) {
        const updatedUser = await authApi.updateMe({
          nickname: trimmedNickname,
          user_type: userType,
        })

        onUpdated(updatedUser)
      }

      // 비밀번호 변경
      if (hasPasswordInput) {
        await authApi.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        })
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setSuccess('회원 정보가 변경되었습니다.')
      onClose()
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          '회원 정보를 수정하지 못했습니다.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white"
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2
              id="profile-settings-title"
              className="text-lg font-bold text-ink"
            >
              회원 정보 수정
            </h2>

            <p className="mt-1 text-xs text-ink-secondary">
              계정 정보를 확인하고 변경할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="설정 닫기"
            className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-page disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="space-y-6 overflow-y-auto px-6 py-6">
          {/* 기본 정보 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound
                size={17}
                className="text-primary-dark"
              />

              <h3 className="text-sm font-bold text-ink">
                기본 정보
              </h3>
            </div>

            {/* 이메일 */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-secondary">
                이메일
              </label>

              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl border border-line bg-page px-4 py-3 text-sm text-ink-muted outline-none"
              />

              <p className="mt-1.5 text-xs text-ink-muted">
                이메일은 변경할 수 없습니다.
              </p>
            </div>

            {/* 닉네임 */}
            <div>
              <label
                htmlFor="profile-nickname"
                className="mb-2 block text-xs font-semibold text-ink-secondary"
              >
                닉네임
              </label>

              <input
                id="profile-nickname"
                type="text"
                value={nickname}
                onChange={(event) =>
                  setNickname(event.target.value)
                }
                maxLength={60}
                placeholder="닉네임을 입력해 주세요"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* 회원 유형 */}
            <div>
              <label
                htmlFor="profile-user-type"
                className="mb-2 block text-xs font-semibold text-ink-secondary"
              >
                회원 유형
              </label>

              <select
                id="profile-user-type"
                value={userType}
                onChange={(event) =>
                  setUserType(event.target.value as UserType)
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary"
              >
                {USER_TYPES.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="border-t border-line" />

          {/* 비밀번호 변경 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <LockKeyhole
                size={17}
                className="text-primary-dark"
              />

              <h3 className="text-sm font-bold text-ink">
                비밀번호 변경
              </h3>
            </div>

            <p className="text-xs leading-5 text-ink-secondary">
              비밀번호를 변경하지 않으려면 아래 항목은
              비워두셔도 됩니다.
            </p>

            {/* 현재 비밀번호 */}
            <div>
              <label
                htmlFor="current-password"
                className="mb-2 block text-xs font-semibold text-ink-secondary"
              >
                현재 비밀번호
              </label>

              <input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                placeholder="현재 비밀번호"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-xs font-semibold text-ink-secondary"
              >
                새 비밀번호
              </label>

              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                placeholder="8자 이상 입력"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-xs font-semibold text-ink-secondary"
              >
                새 비밀번호 확인
              </label>

              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                placeholder="새 비밀번호를 다시 입력"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              className="flex items-center gap-2 text-xs text-ink-secondary hover:text-ink"
            >
              {showPassword ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}

              {showPassword
                ? '비밀번호 숨기기'
                : '비밀번호 표시'}
            </button>
          </section>

          {/* 오류 메시지 */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-xs text-danger"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-xs text-primary-800">
              {success}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 border-t border-line bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-page disabled:opacity-50"
          >
            취소
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />

            {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </section>
    </div>
  )
}
