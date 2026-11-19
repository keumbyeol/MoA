
import { useEffect, useRef, useState } from 'react'
import { Check, FileText, ShieldCheck, X } from 'lucide-react'

export type AgreementType = 'terms' | 'privacy'

interface AgreementModalProps {
  isOpen: boolean
  type: AgreementType
  agreed: boolean
  onAgree: () => void
  onClose: () => void
}

interface AgreementSection {
  title: string
  content: string
}

const AGREEMENTS: Record<
  AgreementType,
  {
    title: string
    description: string
    sections: AgreementSection[]
  }
> = {
  terms: {
    title: '서비스 이용약관',
    description:
      'MOA 서비스 이용에 관한 기본적인 권리와 의무를 안내합니다.',
    sections: [
      {
        title: '제1조 (목적)',
        content:
          '본 약관은 모아(MOA)가 제공하는 금융 정보 안내 서비스의 이용 조건과 절차, 서비스 운영자와 이용자의 권리 및 의무를 정하는 것을 목적으로 합니다.',
      },
      {
        title: '제2조 (서비스 내용)',
        content:
          'MOA는 임금 계산, 세금 및 사회보험 정보 안내, 금융 지원 제도 안내, 금융 상식 퀴즈, AI 기반 정보 안내 등의 서비스를 제공합니다.\n\n서비스의 세부 기능과 제공 범위는 운영 상황에 따라 변경될 수 있습니다.',
      },
      {
        title: '제3조 (회원가입 및 계정 관리)',
        content:
          '이용자는 회원가입에 필요한 정보를 입력하고 필수 약관에 동의하여 가입을 신청할 수 있습니다.\n\n회원은 자신의 계정 정보를 안전하게 관리해야 하며, 타인의 계정을 무단으로 사용해서는 안 됩니다.',
      },
      {
        title: '제4조 (이용자의 의무)',
        content:
          '이용자는 관련 법령과 본 약관을 준수해야 합니다.\n\n서비스의 정상적인 운영을 방해하거나 타인의 권리를 침해하는 행위, 허위 정보를 이용한 부정한 서비스 이용은 금지됩니다.',
      },
      {
        title: '제5조 (금융 정보의 활용)',
        content:
          'MOA에서 제공하는 임금, 세금, 사회보험 및 금융 관련 정보는 일반적인 정보 제공을 목적으로 합니다.\n\n계산 결과는 실제 근로 조건, 적용 법령 및 개인별 상황에 따라 달라질 수 있으며, 법률·세무·금융 전문가의 개별적인 자문을 대신하지 않습니다.\n\n중요한 의사결정 전에는 관계 기관의 공식 정보를 확인하시기 바랍니다.',
      },
      {
        title: '제6조 (서비스 변경 및 중단)',
        content:
          '서비스 운영 및 유지보수를 위해 일부 기능이 변경되거나 일시적으로 중단될 수 있습니다.\n\n이용자에게 중대한 영향을 미치는 변경 사항은 가능한 범위에서 사전에 안내합니다.',
      },
      {
        title: '제7조 (회원 탈퇴)',
        content:
          '회원은 서비스에서 제공하는 절차에 따라 회원 탈퇴를 요청할 수 있습니다.\n\n탈퇴 시 개인정보는 관련 법령에 따라 보존해야 하는 경우를 제외하고 처리 목적이 달성된 후 파기합니다.',
      },
    ],
  },

  privacy: {
    title: '개인정보 수집 및 이용 동의',
    description:
      '회원가입 및 서비스 제공에 필요한 개인정보 처리 내용을 안내합니다.',
    sections: [
      {
        title: '1. 수집하는 개인정보',
        content:
          'MOA는 회원가입 시 다음 정보를 수집합니다.\n\n• 이메일 주소\n• 닉네임\n• 비밀번호\n• 회원 유형(사회초년생, 아르바이트, 외국인 근로자, 재취업 준비, 기타)\n\n비밀번호는 원문이 아닌 안전한 해시 형태로 저장하는 것을 전제로 합니다.',
      },
      {
        title: '2. 개인정보 이용 목적',
        content:
          '수집한 개인정보는 다음 목적으로 이용합니다.\n\n• 회원가입 및 본인 계정 식별\n• 로그인 및 회원 인증\n• 회원 정보 관리\n• 사용자 유형에 따른 금융 정보 안내\n• 서비스 이용 기록 관리',
      },
      {
        title: '3. 보유 및 이용 기간',
        content:
          '수집한 개인정보는 원칙적으로 회원 탈퇴 시까지 보유 및 이용합니다.\n\n다만 관계 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한 기간 동안 보관할 수 있습니다.',
      },
      {
        title: '4. 개인정보 보호',
        content:
          'MOA는 개인정보에 대한 무단 접근, 유출, 훼손 등을 방지하기 위해 필요한 기술적·관리적 보호 조치를 적용합니다.',
      },
      {
        title: '5. 동의 거부 권리',
        content:
          '이용자는 개인정보 수집 및 이용에 동의하지 않을 권리가 있습니다.\n\n다만 회원가입에 필요한 필수 정보 수집에 동의하지 않는 경우 회원가입이 제한됩니다.',
      },
      {
        title: '6. 이용자의 권리',
        content:
          '이용자는 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리 정지를 요청할 수 있습니다.\n\n구체적인 처리 절차는 서비스의 개인정보 처리방침 및 관련 법령에 따릅니다.',
      },
    ],
  },
}

export default function AgreementModal({
  isOpen,
  type,
  agreed,
  onAgree,
  onClose,
}: AgreementModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const [hasReadToEnd, setHasReadToEnd] =
    useState(false)

  const agreement = AGREEMENTS[type]

  useEffect(() => {
    if (!isOpen) return

    setHasReadToEnd(false)

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, type, onClose])

  useEffect(() => {
    if (!isOpen) return

    const element = scrollRef.current

    if (!element) return

    element.scrollTop = 0

    const checkScrollHeight = () => {
      if (
        element.scrollHeight <=
        element.clientHeight + 5
      ) {
        setHasReadToEnd(true)
      }
    }

    const frame = requestAnimationFrame(
      checkScrollHeight,
    )

    return () => cancelAnimationFrame(frame)
  }, [isOpen, type])

  const handleScroll = () => {
    const element = scrollRef.current

    if (!element) return

    const reachedBottom =
      element.scrollTop +
        element.clientHeight >=
      element.scrollHeight - 12

    if (reachedBottom) {
      setHasReadToEnd(true)
    }
  }

  const handleAgree = () => {
    if (!hasReadToEnd) return

    onAgree()
    onClose()
  }

  if (!isOpen) return null

  const Icon =
    type === 'terms' ? FileText : ShieldCheck

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-title"
        className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-[#D7E4CB] bg-white"
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E5EDE0] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F7E9] text-[#739A53]">
              <Icon size={21} />
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold text-[#739A53]">
                MOA · 필수 동의
              </p>

              <h2
                id="agreement-title"
                className="text-[17px] font-bold text-[#344332]"
              >
                {agreement.title}
              </h2>

              <p className="mt-1.5 text-[12px] leading-5 text-[#8D9988]">
                {agreement.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-[#8D9988] transition-colors hover:bg-[#F1F7E9]"
          >
            <X size={20} />
          </button>
        </div>

        {/* 약관 내용 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6"
        >
          <div className="rounded-xl bg-[#F5F9F1] px-4 py-3">
            <p className="text-[12px] leading-6 text-[#667662]">
              아래 내용을 확인하신 후 동의해 주세요.
              필수 항목에 동의하지 않으면
              회원가입을 진행할 수 없습니다.
            </p>
          </div>

          {agreement.sections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-[13px] font-bold text-[#344332]">
                {section.title}
              </h3>

              <p className="whitespace-pre-line text-[12px] leading-[23px] text-[#667662]">
                {section.content}
              </p>
            </section>
          ))}

          <div className="border-t border-[#E5EDE0] pt-4">
            <p className="text-[11px] leading-5 text-[#9AA596]">
              본 약관은 MOA 프로젝트용 초안입니다.
              실제 서비스 운영 전 개인정보 처리 방식,
              운영 주체 및 관련 법령에 맞게
              검토해야 합니다.
            </p>
          </div>
        </div>

        {/* 하단 */}
        <div className="shrink-0 border-t border-[#E5EDE0] bg-white px-6 py-4">
          {!hasReadToEnd && (
            <p className="mb-3 text-center text-[11px] text-[#8D9988]">
              약관을 끝까지 스크롤하면
              동의 버튼이 활성화됩니다.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[46px] flex-1 rounded-xl border border-[#C9DDB8] text-[13px] font-semibold text-[#667662] transition-colors hover:bg-[#F5F9F1]"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleAgree}
              disabled={!hasReadToEnd}
              className="flex h-[46px] flex-[2] items-center justify-center gap-2 rounded-xl bg-[#91B969] text-[13px] font-semibold text-white transition-colors hover:bg-[#82AA5C] disabled:cursor-not-allowed disabled:bg-[#D9E2D3] disabled:text-[#9AA596]"
            >
              {agreed ? (
                <>
                  <Check size={16} />
                  동의 완료
                </>
              ) : (
                <>
                  <Check size={16} />
                  확인 및 동의하기
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
