import { useEffect, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  HandCoins,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Wallet,
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
  type WageRecord,
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
  loadedRecord?: WageRecord | null
}

type DeductionKey =
  | 'national_pension'
  | 'health_insurance'
  | 'employment_insurance'
  | 'income_tax'

const deductionItems: {
  key: DeductionKey
  label: string
  description: string
}[] = [
  {
    key: 'national_pension',
    label: '국민연금',
    description: '국민연금 보험료',
  },
  {
    key: 'health_insurance',
    label: '건강보험',
    description: '건강보험료',
  },
  {
    key: 'employment_insurance',
    label: '고용보험',
    description: '근로자 부담 보험료',
  },
  {
    key: 'income_tax',
    label: '근로소득세',
    description: '지방소득세 포함',
  },
]

function createDefaultForm(): WageCalculateRequest {
  return {
    ...DEFAULT_WAGE_VALUES,
    deductions: { ...DEFAULT_WAGE_DEDUCTIONS },
    shifts: [],
  }
}

export default function WageCalculatorForm({
  onResultChange,
  onRequestChange,
  onLoadingChange,
  onReset,
  calculateKey = 0,
  loadedRecord,
}: WageCalculatorFormProps) {
  const [form, setForm] = useState<WageCalculateRequest>(
    createDefaultForm,
  )

  const [loading, setLoading] = useState(false)

  // 저장 기록 선택 시 당시 입력 조건과 계산 결과를 함께 복원합니다.
  // record.id를 기준으로 하여 일반 입력 중에는 상태를 덮어쓰지 않습니다.
  useEffect(() => {
    if (!loadedRecord) return

    const saved = loadedRecord.request_data
    setForm({
      ...createDefaultForm(),
      ...saved,
      target_year: loadedRecord.target_year,
      target_month: loadedRecord.target_month,
      shifts: (saved.shifts ?? []).map((shift) => ({ ...shift })),
      deductions: {
        ...DEFAULT_WAGE_DEDUCTIONS,
        ...(saved.deductions ?? {}),
        long_term_care: false,
      },
    })
    onRequestChange?.(saved)
    onResultChange(loadedRecord.result_data)
  // 기록을 선택할 때만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedRecord?.id])

  const dailyExtraTotal =
    form.daily_meal_allowance +
    form.daily_transport_allowance +
    form.daily_other_allowance

  const estimatedWorkDays =
    form.work_mode === 'FLEXIBLE'
      ? form.shifts.filter((shift) => shift.attended).length
      : (form.weekly_work_days ?? 0) * (52 / 12)

  const estimatedMonthlyExtras = Math.round(
    dailyExtraTotal * estimatedWorkDays
  )

  const deductions: WageDeductionOptions = {
    ...DEFAULT_WAGE_DEDUCTIONS,
    ...(form.deductions ?? {}),
  }

  const update = (
    changes: Partial<WageCalculateRequest>,
  ) => {
    setForm((previous) => ({
      ...previous,
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
    key: DeductionKey,
    checked: boolean,
  ) => {
    const changes: Partial<WageDeductionOptions> = {
      [key]: checked,
    }

    if (key === 'health_insurance') {
      changes.long_term_care = false
    }

    if (key === 'income_tax') {
      changes.local_income_tax = checked
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

    setLoading(true)
    onLoadingChange?.(true)

    try {
      const payload = buildWagePayload({
        ...form,
        daily_meal_allowance: form.daily_meal_allowance,
        daily_transport_allowance:
          form.daily_transport_allowance,
        daily_other_allowance: form.daily_other_allowance,
        deductions: {
          ...deductions,

          dependents: 1,
          children_8_to_20: 0,
          non_taxable_monthly_pay: 0,

          long_term_care: false,
          local_income_tax: deductions.income_tax,
        },
      })

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
    setForm(createDefaultForm())

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
      {/* 기본 근무 정보 */}
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
          {/* 근무 형태 */}
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

          {/* 시급 */}
          <WageInputField
            label="시급"
            value={form.hourly_wage}
            unit="원"
            min={1}
            onChange={(hourly_wage) =>
              update({ hourly_wage })
            }
          />

          {/* 고정 근무 */}
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
                매주 근무 일정이 다르다면 달력에서
                날짜를 선택하고 출퇴근 시간을 등록해주세요.
                여러 날짜를 선택해 같은 근무시간을
                일괄 등록할 수도 있습니다.
              </p>

              <WageCalendar
                key={loadedRecord?.id ?? 'new'}
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

      {/* 수당 설정 */}
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
                checked={form.include_weekly_holiday_pay}
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

          {/* 사업장 규모 */}
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

          {/* 자동 가산수당 설정 */}
          <div className="space-y-3 rounded-xl border border-[#E3EBDD] bg-[#FBFCF9] px-4 py-4">
            {([
              [
                'include_overtime_pay',
                '연장근로수당 자동 적용',
              ],
              [
                'include_night_pay',
                '야간근로수당 자동 적용 (22:00~06:00)',
              ],
              [
                'include_holiday_work_pay',
                '법정 공휴일 근로수당 자동 적용',
              ],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 text-[14px] text-ink"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) =>
                    update({
                      [key]: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#83B64B]"
                />
                {label}
              </label>
            ))}

            <p className="text-[12px] leading-5 text-ink-muted">
              유동 근무는 날짜와 출퇴근 시간으로
              자동 판정합니다. 일반 토·일요일은
              공휴일로 취급하지 않습니다.
              고정 근무는 날짜·출퇴근 시간이 없어
              자동 판정할 수 없으며, 기존 추가
              근로시간 값만 반영됩니다.
            </p>
          </div>

          <WageInfoBox />
        </div>
      </div>

      {/* 일별 부가 수입 */}
      <div className="mt-7 border-t border-primary-100 pt-6">
        <div className="mb-5 flex items-center gap-2">
          <Wallet
            size={23}
            className="text-primary"
          />

          <h2 className="text-[20px] font-bold text-ink">
            일별 부가 수입
          </h2>

          <span className="text-[13px] text-ink-muted">
            (선택)
          </span>
        </div>

        <p className="mb-4 text-[13px] leading-6 text-ink-secondary">
          근무한 날마다 지급되는 식대, 교통비,
          기타 수당을 입력해주세요.
          근무일수에 따라 예상 금액을 계산합니다.
        </p>

        <div className="space-y-4">
          <WageInputField
            label="일별 식대"
            value={form.daily_meal_allowance}
            unit="원 / 일"
            min={0}
            onChange={(meal) =>
              update({
                daily_meal_allowance: Math.max(0, meal),
              })
            }
          />

          <WageInputField
            label="일별 교통비"
            value={form.daily_transport_allowance}
            unit="원 / 일"
            min={0}
            onChange={(transport) =>
              update({
                daily_transport_allowance:
                  Math.max(0, transport),
              })
            }
          />

          <WageInputField
            label="일별 기타 수당"
            value={form.daily_other_allowance}
            unit="원 / 일"
            min={0}
            onChange={(other) =>
              update({
                daily_other_allowance: Math.max(0, other),
              })
            }
          />
        </div>

        <div className="mt-5 rounded-xl bg-[#F3F8EA] px-4 py-4">
          <p className="text-[12px] text-[#5B783E]">
            예상 월 부가 수입 (급여에 포함)
          </p>

          <p className="mt-1 text-[22px] font-bold text-[#56852B]">
            {estimatedMonthlyExtras.toLocaleString('ko-KR')}원
          </p>

          <p className="mt-1 text-[12px] text-[#6C805D]">
            일별 {dailyExtraTotal.toLocaleString('ko-KR')}원
            {' × '}
            예상{' '}
            {estimatedWorkDays.toLocaleString('ko-KR', {
              maximumFractionDigits: 1,
            })}
            일
          </p>
        </div>

        <p className="mt-3 text-[12px] leading-5 text-ink-muted">
          부가 수입은 총급여 및 예상 공제액에
          포함됩니다. 식대 등 비과세 요건은 별도로
          판정하지 않아 전액 과세 대상으로 추정합니다.
        </p>
      </div>

      {/* 세금 및 4대보험 */}
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
          예상 급여에서 공제할 항목을 선택해주세요.
          실제 가입 및 공제 여부는 근무 조건에 따라
          달라질 수 있습니다.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {deductionItems.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E3EBDD] bg-[#FBFCF9] px-4 py-4 transition-colors hover:border-[#B5D596]"
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

              <div>
                <p className="text-[14px] font-semibold text-ink">
                  {item.label}
                </p>

                <p className="mt-1 text-[11px] text-ink-muted">
                  {item.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[#F3F8EA] px-4 py-3 text-[12px] leading-6 text-[#5B783E]">
          장기요양보험은 계산에서 제외합니다.
          근로소득세 선택 시 지방소득세가 함께 계산됩니다.
        </div>

        <div className="mt-4 rounded-xl bg-[#FFF9E9] px-4 py-3 text-[12px] leading-6 text-[#8B702E]">
          예상 실수령액은 보험요율과 임시 소득세
          추정식을 사용한 참고 금액입니다.
          세금 계산에는 본인 1명, 부양 자녀 없음,
          비과세 급여 0원을 기본값으로 적용합니다.
          실제 원천징수액과 차이가 날 수 있습니다.
        </div>
      </div>

      {/* 계산 버튼 */}
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