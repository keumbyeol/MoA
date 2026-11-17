
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Calculator,
  Home,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'
import { message } from '../common/Message'

const menus = [
  { label: '홈', path: '/home', icon: Home },
  { label: '금융 가이드', path: '/guides' },
  { label: '급여 계산기', path: '/calculator', icon: Calculator },
  { label: '퀴즈', path: '/quiz' },
]

export default function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logout()
      message.success('로그아웃되었습니다.')
      setUserMenuOpen(false)
      navigate('/login', { replace: true })
    } catch {
      message.warning('로그아웃 처리 중 문제가 발생했습니다.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[90px] w-full max-w-[1600px] items-center gap-8 px-6 lg:px-12">
        {/* MOA 로고 */}
        <Link
          to="/home"
          aria-label="MOA 홈으로 이동"
          className="flex shrink-0 items-center"
        >
          <img
            src="/images/logo/moa_logo.png"
            alt="MOA"
            className="h-[54px] w-auto max-w-[180px] object-contain"
          />
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav
          aria-label="주 메뉴"
          className="hidden items-center gap-1 lg:flex xl:gap-2"
        >
          {menus.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/home'}
                className={({ isActive }) =>
                  [
                    'flex h-[46px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-[16px] font-semibold transition-colors xl:px-5',
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-ink hover:bg-primary-50',
                  ].join(' ')
                }
              >
                {Icon && <Icon size={19} strokeWidth={2} />}
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* 사용자 메뉴 및 모바일 메뉴 */}
        <div className="ml-auto flex items-center gap-5">
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="사용자 메뉴"
              aria-expanded={userMenuOpen}
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-primary-100 text-primary-800 transition-colors hover:bg-primary-200"
            >
              <UserRound size={27} strokeWidth={1.9} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-[58px] z-50 w-[250px] overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-lg">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-primary-100 px-5 py-4">
                      <p className="text-[15px] font-bold text-ink">
                        {user?.nickname ?? '회원'}님
                      </p>

                      <p className="mt-1 break-all text-[12px] text-ink-muted">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to="/mypage"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-[14px] text-ink hover:bg-primary-50"
                    >
                      <UserRound size={18} />
                      마이페이지
                    </Link>

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 border-t border-primary-100 px-5 py-3 text-left text-[14px] text-ink hover:bg-primary-50 disabled:opacity-50"
                    >
                      <LogOut size={18} />
                      {loggingOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-b border-primary-100 px-5 py-4">
                      <p className="text-[14px] font-semibold text-ink">
                        로그인이 필요합니다.
                      </p>
                    </div>

                    <Link
                      to="/login"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-[14px] text-ink hover:bg-primary-50"
                    >
                      <LogIn size={18} />
                      로그인
                    </Link>

                    <Link
                      to="/signup"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 border-t border-primary-100 px-5 py-3 text-[14px] text-ink hover:bg-primary-50"
                    >
                      <UserRound size={18} />
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 모바일 메뉴 */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
            className="flex items-center justify-center text-ink lg:hidden"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 목록 */}
      {mobileMenuOpen && (
        <div className="border-t border-primary-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {menus.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/home'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    'rounded-xl px-4 py-3 text-[14px] font-semibold',
                    isActive
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-ink hover:bg-primary-50',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
