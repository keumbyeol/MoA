
import { useState } from 'react'
import {
  Calculator,
  Info,
  RotateCcw,
  CalendarDays,
  Save,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

import type {
  WageBreakdown,
  WageCalculateResponse,
  WageDeductionBreakdown,
} from '../../types/wage'

interface WageResultCardProps {
  result: WageCalculateResponse | null
  loading?: boolean
  saving?: boolean
  onReset: () => void
  onCalculate: () => void
  onSave: () => void
}

type ResultPeriod = 'weekly' | 'monthly'

const formatWon = (value?: number | null) =>
  `${Number(value ?? 0).toLocaleString('ko-KR')}원`

const EMPTY_BREAKDOWN: WageBreakdown = {
  base_pay: 0,
  weekly_holiday_pay: 0,
  overtime_pay: 0,
  night_pay: 0,
  holiday_work_pay: 0,
  total_pay: 0,
}

const deductionRows: {
  label: string
  key: keyof Pick<
    WageDeductionBreakdown,
    | 'national_pension'
    | 'health_insurance'
    | 'long_term_care'
    | 'employment_insurance'
    | 'income_tax'
    | 'local_income_tax'
  >
}[] = [
  { label: '국민연금', key: 'national_pension' },
  { label: '건강보험', key: 'health_insurance' },
  { label: '장기요양보험', key: 'long_term_care' },
  { label: '고용보험', key: 'employment_insurance' },
  { label: '근로소득세', key: 'income_tax' },
  { label: '지방소득세', key: 'local_income_tax' },
]

export default function WageResultCard({
  result,
  loading = false,
  saving = false,
  onReset,
  onCalculate,
  onSave,
}: WageResultCardProps) {
  const [period, setPeriod] =
    useState<ResultPeriod>('monthly')

  const isMonthly = period === 'monthly'

  const breakdown =
    (isMonthly
      ? result?.monthly
      : result?.weekly) ?? EMPTY_BREAKDOWN

  const deductions = result?.deductions ?? null

  const netMonthlyPay =
    result?.net_monthly_pay ??
    deductions?.net_pay ??
    null

  const hasNetPay =
    typeof netMonthlyPay === 'number'

  const rows = [
    {
      label: '기본급 (시급 × 근무시간)',
      amount: breakdown.base_pay,
    },
    {
      label: '주휴수당',
      amount: breakdown.weekly_holiday_pay,
    },
    {
      label: '연장근로수당',
      amount: breakdown.overtime_pay,
    },
    {
      label: '야간근로수당',
      amount: breakdown.night_pay,
    },
    {
      label: '휴일근로수당',
      amount: breakdown.holiday_work_pay,
    },
  ]

  const handleReset = () => {
    setPeriod('monthly')
    onReset()
  }

  return (
    <section className="min-w-0 rounded-[28px] border border-primary-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <Calculator
          size={32}
          className="shrink-0 text-primary"
        />

        <div className="min-w-0">
          <h2 className="text-[24px] font-bold text-ink">
            계산 결과
          </h2>

          <p className="text-[13px] text-ink-secondary">
            입력한 조건으로 예상 급여를 계산했어요.
          </p>
        </div>
      </div>

      {/* 주급 / 월급 전환 */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[#F1F4EB] p-1">
        <button
          type="button"
          onClick={() => setPeriod('weekly')}
          className={[
            'h-11 rounded-lg text-[14px] font-bold transition',
            period === 'weekly'
              ? 'bg-white text-[#5F9134] shadow-sm'
              : 'text-[#788471] hover:text-[#415B31]',
          ].join(' ')}
        >
          주급 보기
        </button>

        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          className={[
            'h-11 rounded-lg text-[14px] font-bold transition',
            isMonthly
              ? 'bg-white text-[#5F9134] shadow-sm'
              : 'text-[#788471] hover:text-[#415B31]',
          ].join(' ')}
        >
          월급 보기
        </button>
      </div>

      {/* 유동 근무 기준 기간 */}
      {result?.work_mode === 'FLEXIBLE' && (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-[#6E7C66]">
          <CalendarDays size={16} />

          {isMonthly ? (
            <span>
              {result.target_year}년{' '}
              {result.target_month}월 근무 기록 기준
            </span>
          ) : (
            <span>
              {result.reference_week_start ?? '-'} ~{' '}
              {result.reference_week_end ?? '-'}
            </span>
          )}
        </div>
      )}

      {/* 세전 급여 */}
      <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#FFF8D4] to-[#FFF0AF] px-5 py-5 sm:px-6">
        <p className="text-[16px] font-semibold text-[#51401C]">
          예상 {isMonthly ? '월급' : '주급'} (세전)
        </p>

        <p className="mt-2 break-words text-right text-[30px] font-extrabold tracking-tight text-[#33270F] sm:text-[36px]">
          {formatWon(breakdown.total_pay)}
        </p>
      </div>

      {/* 급여 상세 내역 */}
      <div className="mt-4 rounded-2xl border border-primary-100 px-4 py-4 sm:px-5">
        <h3 className="mb-2 text-[15px] font-bold text-ink">
          급여 상세 내역
        </h3>

        {rows.map((row, index) => (
          <div
            key={row.label}
            className={[
              'flex items-center justify-between gap-3 py-3 text-[13px] sm:text-[14px]',
              index !== rows.length - 1
                ? 'border-b border-primary-50'
                : '',
            ].join(' ')}
          >
            <span className="text-ink-secondary">
              {row.label}
            </span>

            <span className="shrink-0 font-semibold text-ink">
              {formatWon(row.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* 월급 보기에서만 공제액 표시 */}
      {isMonthly && result && deductions && (
        <div className="mt-4 rounded-2xl border border-primary-100 px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck
              size={19}
              className="text-primary"
            />

            <h3 className="text-[15px] font-bold text-ink">
              예상 공제 내역
            </h3>
          </div>

          <p className="mb-3 text-[12px] leading-5 text-ink-muted">
            선택한 공제 항목과 2026년 일반 보험요율을
            적용한 월 기준 추정 금액입니다.
          </p>

          {deductionRows.map((row, index) => (
            <div
              key={row.key}
              className={[
                'flex items-center justify-between gap-3 py-3 text-[13px] sm:text-[14px]',
                index !== deductionRows.length - 1
                  ? 'border-b border-primary-50'
                  : '',
              ].join(' ')}
            >
              <span className="text-ink-secondary">
                {row.label}
              </span>

              <span className="shrink-0 font-semibold text-ink">
                -{formatWon(deductions[row.key])}
              </span>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-primary-100 pt-4 text-[14px] font-bold">
            <span className="text-ink">
              총 예상 공제액
            </span>

            <span className="text-[#B17D39]">
              -{formatWon(deductions.total_deductions)}
            </span>
          </div>
        </div>
      )}

      {/* 세후 실수령액 */}
      {isMonthly && result && hasNetPay && (
        <div className="mt-4 rounded-2xl bg-[#EAF4DA] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2">
            <Wallet
              size={20}
              className="text-[#56852B]"
            />

            <p className="text-[15px] font-bold text-[#4D752F]">
              예상 실수령액 (세후)
            </p>
          </div>

          <p className="mt-3 break-words text-right text-[30px] font-extrabold tracking-tight text-[#385E1E] sm:text-[36px]">
            {formatWon(netMonthlyPay)}
          </p>

          <p className="mt-2 text-right text-[12px] text-[#66894C]">
            세전 월급 − 예상 공제액
          </p>
        </div>
      )}

      {/* 아직 계산 전 또는 공제 정보가 없는 경우 */}
      {isMonthly && !result && (
        <div className="mt-4 rounded-2xl bg-[#F4F8EE] px-4 py-5 text-center">
          <p className="text-[13px] text-[#7A8A6E]">
            급여를 계산하면 예상 공제액과
            세후 실수령액을 확인할 수 있습니다.
          </p>
        </div>
      )}

      {isMonthly && result && !deductions && (
        <div className="mt-4 rounded-xl bg-[#FFF9E9] px-4 py-3 text-[12px] leading-5 text-[#8B702E]">
          공제 계산 결과가 없습니다.
          백엔드에 최신 공제 계산 코드가 적용되어
          있는지 확인해주세요.
        </div>
      )}

      {/* 주급 안내 */}
      {!isMonthly && result && (
        <div className="mt-4 rounded-xl bg-[#F4F8EE] px-4 py-3 text-[12px] leading-5 text-[#6E7C66]">
          주급은 세전 금액으로 표시됩니다.
          세금 및 보험료는 월 기준으로 추정하므로
          월급 보기에서 예상 실수령액을 확인해주세요.
        </div>
      )}

      {/* 유동 근무 통계 */}
      {result?.work_mode === 'FLEXIBLE' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F4F8EE] p-4 text-center">
            <p className="text-[12px] text-[#7A8A6E]">
              월 근무일수
            </p>

            <p className="mt-1 text-[19px] font-bold text-[#56852B]">
              {result.total_work_days ?? 0}일
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F8EE] p-4 text-center">
            <p className="text-[12px] text-[#7A8A6E]">
              월 근무시간
            </p>

            <p className="mt-1 text-[19px] font-bold text-[#56852B]">
              {(result.total_work_hours ?? 0).toLocaleString(
                'ko-KR',
              )}
              시간
            </p>
          </div>
        </div>
      )}

      {/* 예상 금액 안내 */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-surface-muted p-4">
        <Info
          size={21}
          className="mt-0.5 shrink-0 text-primary"
        />

        <p className="text-[13px] leading-6 text-ink-secondary">
          {result?.disclaimer ??
            '근무 조건을 입력하고 계산하면 예상 급여와 공제 내역을 확인할 수 있습니다. 실제 지급 금액과 차이가 발생할 수 있습니다.'}
        </p>
      </div>

      {result && result.notes.length > 0 && (
        <details className="mt-4 rounded-xl border border-[#E6ECD9] px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-[#5F843F]">
            계산 기준 자세히 보기
          </summary>

          <ul className="mt-3 list-disc space-y-2 pl-4 text-[12px] leading-5 text-[#788471]">
            {result.notes.map((note, index) => (
              <li key={`${index}-${note}`}>
                {note}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* 기존 버튼 유지 */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-2 text-[13px] font-semibold text-primary-700 transition hover:bg-primary-50 sm:text-[15px]"
        >
          <RotateCcw size={19} />
          조건 초기화
        </button>

        <button
          type="button"
          onClick={onCalculate}
          disabled={loading}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:text-[15px]"
        >
          <Calculator size={19} />
          {loading ? '계산 중...' : '다시 계산하기'}
        </button>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!result || loading || saving}
        className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#EAF4DA] text-[15px] font-bold text-[#56852B] transition hover:bg-[#DDEFC7] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save size={19} />

        {saving
          ? '저장 중...'
          : '급여 계산 결과 저장하기'}
      </button>

      <p className="mt-2 text-center text-[12px] text-ink-muted">
        저장한 급여는 아래 월별 급여 내역에서 확인할 수 있습니다.
      </p>
    </section>
  )
}
