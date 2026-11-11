
import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Wallet,
} from 'lucide-react'

import {
  deleteWageRecord,
  getWageRecords,
} from '../../api/wage'

import type {
  WageRecord,
  WageDeductionBreakdown,
} from '../../types/wage'

import { message } from '../common/Message'

interface WageRecordListProps {
  refreshKey?: number
}

const formatWon = (value?: number | null) =>
  `${Number(value ?? 0).toLocaleString('ko-KR')}원`

const formatDate = (value: string) => {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('ko-KR')
}

const deductionLabels: {
  key: keyof Pick<
    WageDeductionBreakdown,
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

export default function WageRecordList({
  refreshKey = 0,
}: WageRecordListProps) {
  const [records, setRecords] = useState<WageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] =
    useState<number | null>(null)
  const [expandedId, setExpandedId] =
    useState<number | null>(null)

  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')

  const loadRecords = useCallback(async () => {
    setLoading(true)

    try {
      const data = await getWageRecords(
        year ? Number(year) : undefined,
        month ? Number(month) : undefined,
      )

      setRecords(data)
    } catch (error) {
      console.error('급여 기록 조회 오류:', error)
      message.error('급여 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords, refreshKey])

  const handleDelete = async (recordId: number) => {
    if (
      !window.confirm(
        '이 급여 기록을 삭제하시겠습니까?',
      )
    ) {
      return
    }

    setDeletingId(recordId)

    try {
      await deleteWageRecord(recordId)

      setRecords((prev) =>
        prev.filter(
          (record) => record.id !== recordId,
        ),
      )

      if (expandedId === recordId) {
        setExpandedId(null)
      }

      message.success('급여 기록을 삭제했습니다.')
    } catch (error) {
      console.error('급여 기록 삭제 오류:', error)
      message.error('급여 기록 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const years = Array.from(
    { length: 8 },
    (_, index) => new Date().getFullYear() + 1 - index,
  )

  return (
    <section className="mt-8 rounded-[28px] border border-primary-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet
            size={27}
            className="text-primary"
          />

          <div>
            <h2 className="text-[23px] font-bold text-ink">
              내 월별 급여 내역
            </h2>

            <p className="mt-1 text-[13px] text-ink-secondary">
              저장한 예상 급여와 근무 조건을 확인해보세요.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadRecords()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-primary-100 px-4 py-2 text-[13px] font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={year}
          onChange={(event) =>
            setYear(event.target.value)
          }
          className="h-11 rounded-xl border border-primary-100 bg-white px-4 text-[14px] text-ink"
        >
          <option value="">전체 연도</option>

          {years.map((item) => (
            <option key={item} value={item}>
              {item}년
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(event) =>
            setMonth(event.target.value)
          }
          className="h-11 rounded-xl border border-primary-100 bg-white px-4 text-[14px] text-ink"
        >
          <option value="">전체 월</option>

          {Array.from(
            { length: 12 },
            (_, index) => index + 1,
          ).map((item) => (
            <option key={item} value={item}>
              {item}월
            </option>
          ))}
        </select>

        {(year || month) && (
          <button
            type="button"
            onClick={() => {
              setYear('')
              setMonth('')
            }}
            className="text-[13px] text-ink-muted hover:text-primary"
          >
            필터 초기화
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-[14px] text-ink-muted">
          급여 기록을 불러오는 중입니다...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-[#F6F9F1] px-4 py-12 text-center">
          <CalendarDays
            size={35}
            className="mx-auto text-[#A4BF87]"
          />

          <p className="mt-3 text-[15px] font-semibold text-[#657C50]">
            저장된 급여 기록이 없습니다.
          </p>

          <p className="mt-2 text-[13px] text-ink-muted">
            급여를 계산한 뒤 결과를 저장해보세요.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {records.map((record) => {
            const expanded =
              expandedId === record.id

            const result = record.result_data
            const breakdown = result?.monthly
            const deductions = result?.deductions
            const request = record.request_data

            const hasNetPay =
              typeof result?.net_monthly_pay ===
                'number' ||
              typeof deductions?.net_pay === 'number'

            const netPay =
              result?.net_monthly_pay ??
              deductions?.net_pay ??
              null

            const details = [
              ['기본급', breakdown?.base_pay],
              ['주휴수당', breakdown?.weekly_holiday_pay],
              ['연장근로수당', breakdown?.overtime_pay],
              ['야간근로수당', breakdown?.night_pay],
              ['휴일근로수당', breakdown?.holiday_work_pay],
            ] as const

            return (
              <div
                key={record.id}
                className="overflow-hidden rounded-2xl border border-[#E4ECD9]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#EFF7E5] p-3">
                      <CalendarDays
                        size={21}
                        className="text-[#77A64B]"
                      />
                    </div>

                    <div>
                      <p className="text-[16px] font-bold text-ink">
                        {record.target_year}년{' '}
                        {record.target_month}월
                      </p>

                      <p className="mt-1 text-[12px] text-ink-muted">
                        {record.work_mode === 'FIXED'
                          ? '고정 근무'
                          : '유동 근무'}
                        {' · '}
                        저장일{' '}
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[12px] text-ink-muted">
                        {hasNetPay
                          ? '예상 실수령액'
                          : '예상 월급 (세전)'}
                      </p>

                      <p className="text-[19px] font-extrabold text-[#56852B]">
                        {formatWon(
                          hasNetPay
                            ? netPay
                            : record.total_pay,
                        )}
                      </p>

                      {hasNetPay && (
                        <p className="mt-1 text-[12px] text-ink-muted">
                          세전 {formatWon(record.total_pay)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : record.id,
                        )
                      }
                      className="rounded-lg p-2 text-primary hover:bg-primary-50"
                      aria-label="상세 내역 보기"
                    >
                      {expanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-[#E4ECD9] bg-[#FBFCF9] p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap gap-4 text-[13px] text-ink-secondary">
                      <span>
                        시급: {formatWon(record.hourly_wage)}
                      </span>

                      <span>
                        사업장:{' '}
                        {request?.workplace_employee_count ===
                        'AT_LEAST_5'
                          ? '5인 이상'
                          : '5인 미만'}
                      </span>

                      {record.work_mode === 'FLEXIBLE' ? (
                        <span>
                          근무일수:{' '}
                          {result?.total_work_days ?? 0}일
                        </span>
                      ) : (
                        <span>
                          주 {request?.weekly_work_days ?? 0}일
                          {' / '}일{' '}
                          {request?.daily_work_hours ?? 0}시간
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {details.map(([label, amount]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-3 text-[13px]"
                        >
                          <span className="text-ink-secondary">
                            {label}
                          </span>

                          <span className="font-semibold text-ink">
                            {formatWon(amount)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between border-t border-[#E4ECD9] pt-4 font-bold text-ink">
                      <span>예상 월급 (세전)</span>
                      <span>
                        {formatWon(
                          breakdown?.total_pay ??
                            record.total_pay,
                        )}
                      </span>
                    </div>

                    {deductions ? (
                      <>
                        <div className="mt-5 border-t border-[#E4ECD9] pt-4">
                          <p className="mb-4 text-[14px] font-bold text-ink">
                            예상 공제 내역
                          </p>

                          <div className="space-y-3">
                            {deductionLabels.map((item) => (
                              <div
                                key={item.key}
                                className="flex justify-between gap-3 text-[13px]"
                              >
                                <span className="text-ink-secondary">
                                  {item.label}
                                </span>
                                <span className="font-semibold text-ink">
                                  -{formatWon(
                                    deductions[item.key],
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex justify-between border-t border-[#E4ECD9] pt-4 text-[14px] font-semibold text-ink">
                            <span>총 예상 공제액</span>
                            <span>
                              -{formatWon(
                                deductions.total_deductions,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#EDF6DF] px-4 py-4">
                          <span className="text-[14px] font-bold text-[#4D752F]">
                            예상 실수령액
                          </span>

                          <span className="text-[19px] font-extrabold text-[#56852B]">
                            {formatWon(netPay)}
                          </span>
                        </div>

                        <p className="mt-3 text-[12px] leading-5 text-ink-muted">
                          일반적인 공제 조건을 적용한
                          참고용 예상 금액입니다.
                          소득세는 공식 간이세액표가 아닌
                          임시 추정치로 실제 지급액과
                          차이가 발생할 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 rounded-xl bg-[#F3F6EE] px-4 py-3 text-[12px] text-ink-muted">
                        이전에 저장된 기록으로 공제 내역이
                        포함되어 있지 않습니다.
                        세후 실수령액을 확인하려면
                        현재 계산기로 다시 계산해주세요.
                      </p>
                    )}

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        disabled={
                          deletingId === record.id
                        }
                        onClick={() =>
                          void handleDelete(record.id)
                        }
                        className="flex items-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        {deletingId === record.id
                          ? '삭제 중...'
                          : '기록 삭제'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
