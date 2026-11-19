
import { useState } from 'react'
import { Settings, UserRound } from 'lucide-react'

import type { User, UserType } from '../../api/auth'
import ProfileSettingsModal from './ProfileSettingsModal'

const USER_TYPE_LABELS: Record<UserType, string> = {
  FIRST_JOB: '사회초년생',
  PART_TIME: '아르바이트',
  FOREIGN_WORKER: '외국인 근로자',
  RETURNING: '재취업 준비',
  OTHER: '일반회원',
}

interface MyPageProfileProps {
  user: User | null | undefined
  isLoading?: boolean
  onUpdated?: (user: User) => void
}

export default function MyPageProfile({
  user,
  isLoading = false,
  onUpdated,
}: MyPageProfileProps) {
  const [isSettingsOpen, setIsSettingsOpen] =
    useState(false)

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {/* 프로필 정보 */}
        <div className="flex min-w-0 items-center gap-4">
          {/* 프로필 아이콘 */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-white text-primary-700">
            <UserRound
              size={30}
              strokeWidth={1.7}
            />
          </div>

          <div className="min-w-0">
            {isLoading ? (
              <div className="h-6 w-32 animate-pulse rounded-lg bg-primary-100" />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-ink">
                  {user?.nickname ?? '사용자'}
                </h2>

                {user && (
                  <span className="rounded-full border border-primary-200 bg-white px-2.5 py-1 text-xs font-semibold text-primary-800">
                    {USER_TYPE_LABELS[user.user_type] ??
                      '일반회원'}
                  </span>
                )}
              </div>
            )}

            <p className="mt-1 truncate text-sm text-ink-secondary">
              {user?.email ??
                '내 금융 활동을 확인해 보세요.'}
            </p>
          </div>
        </div>

        {/* 설정 버튼 */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          disabled={!user || isLoading}
          aria-label="회원 정보 설정"
          title="회원 정보 수정"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Settings size={17} />

          <span className="hidden sm:inline">
            정보 수정
          </span>
        </button>
      </div>

      {/* 회원 정보 수정 모달 */}
      {user && (
        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          onUpdated={(updatedUser) => {
            onUpdated?.(updatedUser)
          }}
        />
      )}
    </>
  )
}
