
import { useEffect, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  HandCoins,
  CalendarDays,
  Clock3,
  ShieldCheck,
} from 'lucide-react'

import {
  calculateWage,
  buildWagePayload,
} from '../../api/wage'

import { message } from '../common/Message'

import {
  DEFAULT_WAGE_VALUES,
  DEFAULT_WAGE_DEDUCTIONS,
  type WageCalculateRequest,
  type WageCalculateResponse,
  type WageDeductionOptions,
  type WorkShift,
} from '../../types/wage'

import WageCalendar from './WageCalendar'
import WageInputField from './WageInputField'
import WageInfoBox from './WageInfoBox'

interface WageCalculatorFormProps {
  onResultChange: (
    result: WageCalculateResponse | null,
  ) => void
  onRequestChange?: (
    request: WageCalculateRequest | null,
  ) => void
  onLoadingChange?: (loading: boolean) => void
  onReset?: () => void
  calculateKey?: number
}

const deductionItems: {
  key: keyof Pick<
    WageDeductionOptions,
    | 'national_pension'
    | 'health_insurance'
    | 'long_term_care'
    | 'employment_insurance'
    | 'income_tax'
    | 'local_income_tax'
  >
  label: string
}[] = [
  { key: 'national_pension', label: '국민연금' },
  { key: 'health_insurance', label: '건강보험' },
  { key: 'long_term_care', label: '장기요양보험' },
  { key: 'employment_insurance', label: '고용보험' },
  { key: 'income_tax', label: '근로소득세' },
  { key: 'local_income_tax', label: '지방소득세' },
]

export default function WageCalculatorForm({
  onResultChange,
  onRequestChange,
  onLoadingChange,
  onReset,
  calculateKey = 0,
}: WageCalculatorFormProps) {
  const [form, setForm] = useState<WageCalculateRequest>({
    ...DEFAULT_WAGE_VALUES,
    deductions: { ...DEFAULT_WAGE_DEDUCTIONS },
    shifts: [],
  })

  const [loading, setLoading] = useState(false)

  const deductions = {
    ...DEFAULT_WAGE_DEDUCTIONS,
    ...(form.deductions ?? {}),
  }

  const update = (
    changes: Partial<WageCalculateRequest>,
  ) => {
    setForm((prev) => ({
      ...prev,
      ...changes,
    }))

    onResultChange(null)
    onRequestChange?.(null)
  }

  const updateDeductions = (
    changes: Partial<WageDeductionOptions>,
  ) => {
    update({
      deductions: {
        ...deductions,
        ...changes,
      },
    })
  }

  const toggleDeduction = (
    key: (typeof deductionItems)[number]['key'],
    checked: boolean,
  ) => {
    const changes: Partial<WageDeductionOptions> = {
      [key]: checked,
    }

    // 연동되는 공제 항목은 함께 해제
    if (key === 'health_insurance' && !checked) {
      changes.long_term_care = false
    }

    if (key === 'income_tax' && !checked) {
      changes.local_income_tax = false
    }

    if (key === 'long_term_care' && checked) {
      changes.health_insurance = true
    }

    if (key === 'local_income_tax' && checked) {
      changes.income_tax = true
    }

    updateDeductions(changes)
  }

  const handleCalculate = async () => {
    if (loading) return

    if (
      !Number.isFinite(form.hourly_wage) ||
      form.hourly_wage <= 0
    ) {
      message.warning('시급을 올바르게 입력해주세요.')
      return
    }

    if (form.work_mode === 'FIXED') {
      const dailyHours = form.daily_work_hours ?? 0
      const weeklyDays = form.weekly_work_days ?? 0

      if (dailyHours <= 0 || weeklyDays <= 0) {
        message.warning(
          '근무시간과 근무일수를 입력해주세요.',
        )
        return
      }

      if (dailyHours * weeklyDays > 40) {
        message.warning(
          '주 소정근로시간은 40시간을 초과할 수 없습니다.',
        )
        return
      }

      if (
        dailyHours * weeklyDays +
          form.weekly_overtime_hours >
        52
      ) {
        message.warning(
          '주 근로시간과 연장근로시간의 합은 52시간을 초과할 수 없습니다.',
        )
        return
      }
    }

    if (
      form.work_mode === 'FLEXIBLE' &&
      form.shifts.length === 0
    ) {
      message.warning(
        '달력에서 근무 날짜를 등록해주세요.',
      )
      return
    }

    if (
      deductions.children_8_to_20 >
      deductions.dependents - 1
    ) {
      message.warning(
        '자녀 수는 본인을 제외한 부양가족 수보다 많을 수 없습니다.',
      )
      return
    }

    setLoading(true)
    onLoadingChange?.(true)

    try {
      const payload = buildWagePayload(form)
      const calculated = await calculateWage(payload)

      onRequestChange?.(payload)
      onResultChange(calculated)

      message.success('예상 급여를 계산했습니다.')
    } catch (error) {
      console.error('급여 계산 오류:', error)

      onResultChange(null)
      onRequestChange?.(null)

      message.error(
        '급여 계산에 실패했습니다. 입력 조건을 확인해주세요.',
      )
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  const calculateRef = useRef(handleCalculate)
  calculateRef.current = handleCalculate

  const previousCalculateKey = useRef(calculateKey)

  useEffect(() => {
    if (
      previousCalculateKey.current === calculateKey
    ) {
      return
    }

    previousCalculateKey.current = calculateKey
    void calculateRef.current()
  }, [calculateKey])

  const handleReset = () => {
    setForm({
      ...DEFAULT_WAGE_VALUES,
      deductions: { ...DEFAULT_WAGE_DEDUCTIONS },
      shifts: [],
    })

    onResultChange(null)
    onRequestChange?.(null)
    onReset?.()
  }

  const changeMonth = (
    year: number,
    month: number,
  ) => {
    update({
      target_year: year,
      target_month: month,
      reference_date: null,
      shifts: [],
    })
  }

  const changeShifts = (
    shifts: WorkShift[],
  ) => {
    update({ shifts })
  }

  return (
    <section className="min-w-0 rounded-[28px] border border-primary-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <div className="mb-5 flex items-center gap-2">
          <BriefcaseBusiness
            size={23}
            className="text-primary"
          />
          <h2 className="text-[20px] font-bold text-ink">
            기본 근무 정보
          </h2>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[115px_minmax(0,1fr)] sm:items-center">
            <span className="text-[15px] text-ink">
              근무 형태
            </span>

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F2F4EE] p-1">
              <button
                type="button"
                onClick={() =>
                  update({ work_mode: 'FIXED' })
                }
                className={[
                  'flex min-h-10 items-center justify-center gap-2 rounded-lg text-[14px] font-semibold transition',
                  form.work_mode === 'FIXED'
                    ? 'bg-[#83B64B] text-white shadow-sm'
                    : 'text-[#586451] hover:bg-white',
                ].join(' ')}
              >
                <Clock3 size={16} />
                고정 근무
              </button>

              <button
                type="button"
                onClick={() =>
                  update({ work_mode: 'FLEXIBLE' })
                }
                className={[
                  'flex min-h-10 items-center justify-center gap-2 rounded-lg text-[14px] font-semibold transition',
                  form.work_mode === 'FLEXIBLE'
                    ? 'bg-[#83B64B] text-white shadow-sm'
                    : 'text-[#586451] hover:bg-white',
                ].join(' ')}
              >
                <CalendarDays size={16} />
                유동 근무
              </button>
            </div>
          </div>

          <WageInputField
            label="시급"
            value={form.hourly_wage}
            unit="원"
            min={1}
            onChange={(hourly_wage) =>
              update({ hourly_wage })
            }
          />

          {form.work_mode === 'FIXED' ? (
            <>
              <WageInputField
                label="일 근무시간"
                value={form.daily_work_hours ?? 0}
                unit="시간"
                min={0.5}
                max={24}
                step={0.5}
                onChange={(daily_work_hours) =>
                  update({ daily_work_hours })
                }
              />

              <WageInputField
                label="주 근무일수"
                value={form.weekly_work_days ?? 0}
                unit="일"
                min={1}
                max={7}
                onChange={(weekly_work_days) =>
                  update({ weekly_work_days })
                }
              />

              <div className="rounded-xl bg-[#F3F8EA] px-4 py-3 text-[13px] text-[#5B783E]">
                주 소정근로시간:{' '}
                <strong>
                  {(
                    (form.daily_work_hours ?? 0) *
                    (form.weekly_work_days ?? 0)
                  ).toLocaleString('ko-KR')}
                  시간
                </strong>
                <span className="ml-2 text-[#829474]">
                  (일 근무시간 × 주 근무일수)
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-6 text-ink-secondary">
                매주 근무 일정이 달라진다면 달력에서
                날짜를 선택하고 출퇴근 시간을 등록해주세요.
              </p>

              <WageCalendar
                year={
                  form.target_year ??
                  new Date().getFullYear()
                }
                month={
                  form.target_month ??
                  new Date().getMonth() + 1
                }
                shifts={form.shifts}
                onMonthChange={changeMonth}
                onChange={changeShifts}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-7 border-t border-primary-100 pt-6">
        <div className="mb-5 flex items-center gap-2">
          <HandCoins
            size={23}
            className="text-primary"
          />
          <h2 className="text-[20px] font-bold text-ink">
            수당 설정
          </h2>
          <span className="text-[13px] text-ink-muted">
            (선택)
          </span>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
              <input
                type="checkbox"
                checked={
                  form.include_weekly_holiday_pay
                }
                onChange={(event) =>
                  update({
                    include_weekly_holiday_pay:
                      event.target.checked,
                  })
                }
                className="h-4 w-4 accent-[#83B64B]"
              />
              주휴수당 포함
            </label>

            {form.work_mode === 'FIXED' && (
              <label className="flex cursor-pointer items-center gap-2 text-[14px] text-ink">
                <input
                  type="checkbox"
                  checked={form.attendance_completed}
                  onChange={(event) =>
                    update({
                      attendance_completed:
                        event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#83B64B]"
                />
                소정근로일 개근
              </label>
            )}
          </div>

          <div>
            <p className="mb-2 text-[14px] font-semibold text-ink">
              사업장 규모
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: 'AT_LEAST_5' as const,
                  label: '5인 이상',
                },
                {
                  value: 'UNDER_5' as const,
                  label: '5인 미만',
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    update({
                      workplace_employee_count:
                        item.value,
                    })
                  }
                  className={[
                    'h-11 rounded-xl border text-[14px] font-semibold transition',
                    form.workplace_employee_count ===
                    item.value
                      ? 'border-[#83B64B] bg-[#EAF4DA] text-[#56852B]'
                      : 'border-[#E3E7DD] bg-white text-[#65705E]',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {form.work_mode === 'FIXED' && (
            <div className="space-y-4">
              <WageInputField
                label="주 연장근로"
                value={form.weekly_overtime_hours}
                unit="시간"
                min={0}
                max={52}
                step={0.5}
                onChange={(weekly_overtime_hours) =>
                  update({ weekly_overtime_hours })
                }
              />

              <WageInputField
                label="주 야간근로"
                value={form.weekly_night_hours}
                unit="시간"
                min={0}
                step={0.5}
                onChange={(weekly_night_hours) =>
                  update({ weekly_night_hours })
                }
              />

              <WageInputField
                label="주 휴일근로"
                value={
                  form.weekly_holiday_work_hours
                }
                unit="시간"
                min={0}
                step={0.5}
                onChange={(weekly_holiday_work_hours) =>
                  update({
                    weekly_holiday_work_hours,
                  })
                }
              />

              <p className="text-[12px] leading-5 text-ink-muted">
                야간·휴일근로시간은 기본 근무시간에
                포함된 시간으로 입력해주세요.
                연장근로시간은 별도 추가 시간입니다.
              </p>
            </div>
          )}

          <WageInfoBox />
        </div>
      </div>

      <div className="mt-7 border-t border-primary-100 pt-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck
            size={23}
            className="text-primary"
          />
          <h2 className="text-[20px] font-bold text-ink">
            세금 및 4대보험
          </h2>
          <span className="text-[13px] text-ink-muted">
            (선택)
          </span>
        </div>

        <p className="mb-4 text-[13px] leading-6 text-ink-secondary">
          공제되는 항목을 선택해주세요.
          실제 가입 및 공제 여부는 근무 조건에 따라
          달라질 수 있습니다.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {deductionItems.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E3EBDD] bg-[#FBFCF9] px-3 py-3 text-[13px] text-ink"
            >
              <input
                type="checkbox"
                checked={deductions[item.key]}
                onChange={(event) =>
                  toggleDeduction(
                    item.key,
                    event.target.checked,
                  )
                }
                className="h-4 w-4 shrink-0 accent-[#83B64B]"
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <WageInputField
            label="부양가족 수"
            value={deductions.dependents}
            unit="명"
            min={1}
            max={20}
            onChange={(dependents) =>
              updateDeductions({
                dependents,
                children_8_to_20: Math.min(
                  deductions.children_8_to_20,
                  Math.max(dependents - 1, 0),
                ),
              })
            }
          />

          <WageInputField
            label="8~20세 자녀 수"
            value={deductions.children_8_to_20}
            unit="명"
            min={0}
            max={20}
            onChange={(children_8_to_20) =>
              updateDeductions({
                children_8_to_20,
              })
            }
          />

          <WageInputField
            label="월 비과세 급여"
            value={deductions.non_taxable_monthly_pay}
            unit="원"
            min={0}
            onChange={(non_taxable_monthly_pay) =>
              updateDeductions({
                non_taxable_monthly_pay,
              })
            }
          />

          <p className="text-[12px] leading-5 text-ink-muted">
            부양가족 수에는 본인을 포함합니다.
            비과세 급여는 세금·보험료 추정 시
            차감하는 금액이며, 실제 비과세 인정
            여부는 별도로 확인해야 합니다.
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-[#FFF9E9] px-4 py-3 text-[12px] leading-6 text-[#8B702E]">
          예상 실수령액은 2026년 일반 보험요율과
          임시 소득세 추정식을 사용한 참고 금액입니다.
          국세청 근로소득 간이세액표가 아직
          적용되지 않았으므로 실제 원천징수액과
          차이가 날 수 있습니다.
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleCalculate()}
        disabled={loading}
        className="mt-7 h-[52px] w-full rounded-xl bg-primary text-[16px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? '계산 중...'
          : form.work_mode === 'FLEXIBLE'
            ? '선택한 월 급여 계산하기'
            : '예상 급여 계산하기'}
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="mt-3 w-full text-[13px] text-ink-muted hover:text-primary"
      >
        입력 조건 초기화
      </button>
    </section>
  )
}
