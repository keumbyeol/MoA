
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import type { WorkShift } from '../../types/wage'
import { message } from '../common/Message'

interface WageCalendarProps {
  year: number
  month: number
  shifts: WorkShift[]
  onMonthChange: (year: number, month: number) => void
  onChange: (shifts: WorkShift[]) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function dateKey(year: number, month: number, day: number) {
  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function getHours(shift: WorkShift) {
  if (!shift.attended) return 0

  const [sh, sm] = shift.start_time.split(':').map(Number)
  const [eh, em] = shift.end_time.split(':').map(Number)

  let minutes = eh * 60 + em - (sh * 60 + sm)

  if (minutes <= 0) minutes += 1440

  return Math.max(
    0,
    (minutes - shift.break_minutes) / 60,
  )
}

function makeShift(workDate: string): WorkShift {
  return {
    work_date: workDate,
    start_time: '09:00',
    end_time: '18:00',
    break_minutes: 60,
    night_break_minutes: 0,
    is_scheduled: true,
    attended: true,
    is_holiday: false,
  }
}

export default function WageCalendar({
  year,
  month,
  shifts,
  onMonthChange,
  onChange,
}: WageCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [draft, setDraft] = useState<WorkShift | null>(null)

  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const lastDate = new Date(year, month, 0).getDate()

    const cells: (string | null)[] = [
      ...Array.from({ length: firstDay }, () => null),
    ]

    for (let day = 1; day <= lastDate; day += 1) {
      cells.push(dateKey(year, month, day))
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [year, month])

  const shiftsByDate = useMemo(
    () => new Map(shifts.map((shift) => [shift.work_date, shift])),
    [shifts],
  )

  const selectedDate = selectedDates[0] ?? null

  const selectedShift =
    selectedDates.length === 1 && selectedDate
      ? shiftsByDate.get(selectedDate)
      : null

  useEffect(() => {
    setSelectedDates([])
    setDraft(null)
  }, [year, month])

  const selectDate = (date: string) => {
    if (selectedDates.includes(date)) {
      const next = selectedDates.filter((item) => item !== date)

      setSelectedDates(next)

      if (next.length === 1) {
        const existing = shiftsByDate.get(next[0])
        setDraft(
          existing
            ? { ...existing }
            : makeShift(next[0]),
        )
      } else if (next.length === 0) {
        setDraft(null)
      }

      return
    }

    const next = [...selectedDates, date].sort()

    setSelectedDates(next)

    if (next.length === 1) {
      const existing = shiftsByDate.get(date)
      setDraft(
        existing
          ? { ...existing }
          : makeShift(date),
      )
    } else if (selectedDates.length === 1 && draft) {
      // 여러 날짜를 선택할 때 현재 입력값을 유지합니다.
      setDraft({ ...draft })
    } else if (!draft) {
      setDraft(makeShift(date))
    }
  }

  const changeMonth = (offset: number) => {
    const next = new Date(year, month - 1 + offset, 1)

    onMonthChange(
      next.getFullYear(),
      next.getMonth() + 1,
    )
  }

  const updateDraft = (changes: Partial<WorkShift>) => {
    setDraft((previous) =>
      previous ? { ...previous, ...changes } : previous,
    )
  }

  const saveShifts = () => {
    if (!draft || selectedDates.length === 0) return

    const hours = getHours(draft)

    if (draft.attended && hours <= 0) {
      message.warning(
        '출퇴근 시간과 휴게시간을 확인해주세요.',
      )
      return
    }

    if (
      draft.night_break_minutes != null &&
      draft.night_break_minutes > draft.break_minutes
    ) {
      message.warning(
        '야간 휴게시간은 전체 휴게시간보다 클 수 없습니다.',
      )
      return
    }

    const selectedSet = new Set(selectedDates)

    const newShifts: WorkShift[] = selectedDates.map((date) => ({
      ...draft,
      work_date: date,
    }))

    const next = [
      ...shifts.filter(
        (shift) => !selectedSet.has(shift.work_date),
      ),
      ...newShifts,
    ].sort((a, b) =>
      a.work_date.localeCompare(b.work_date),
    )

    onChange(next)

    message.success(
      `${selectedDates.length}일의 근무 일정이 저장되었습니다.`,
    )

    setSelectedDates([])
    setDraft(null)
  }

  const deleteShifts = () => {
    if (selectedDates.length === 0) return

    const selectedSet = new Set(selectedDates)

    const registeredCount = selectedDates.filter(
      (date) => shiftsByDate.has(date),
    ).length

    if (registeredCount === 0) {
      setSelectedDates([])
      setDraft(null)
      return
    }

    onChange(
      shifts.filter(
        (shift) => !selectedSet.has(shift.work_date),
      ),
    )

    message.success(
      `${registeredCount}일의 근무 기록이 삭제되었습니다.`,
    )

    setSelectedDates([])
    setDraft(null)
  }

  const clearSelection = () => {
    setSelectedDates([])
    setDraft(null)
  }

  const totalHours = shifts.reduce(
    (sum, shift) => sum + getHours(shift),
    0,
  )

  const registeredDays = shifts.filter(
    (shift) => shift.attended,
  ).length

  const existingSelectedCount = selectedDates.filter(
    (date) => shiftsByDate.has(date),
  ).length

  return (
    <div className="rounded-[22px] border border-[#E5ECD9] bg-[#FBFCF7] p-4 sm:p-5">
      {/* 달력 헤더 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={21}
            className="text-[#78A83E]"
          />

          <h3 className="text-[17px] font-bold text-[#263822]">
            날짜별 근무 등록
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
            className="rounded-lg p-2 hover:bg-[#EAF3D9]"
          >
            <ChevronLeft size={19} />
          </button>

          <span className="min-w-[105px] text-center font-bold text-[#263822]">
            {year}년 {month}월
          </span>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="다음 달"
            className="rounded-lg p-2 hover:bg-[#EAF3D9]"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <p className="mb-4 text-[12px] leading-5 text-[#77816E]">
        날짜를 여러 개 선택한 뒤 동일한 근무시간을
        한 번에 등록할 수 있습니다.
        날짜별로 시간이 다르다면 하나씩 선택해 수정하세요.
      </p>

      {/* 요일 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={[
              'py-2 text-center text-[12px] font-semibold',
              index === 0
                ? 'text-[#D17B71]'
                : 'text-[#77816E]',
            ].join(' ')}
          >
            {day}
          </div>
        ))}

        {/* 날짜 */}
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[58px]"
              />
            )
          }

          const shift = shiftsByDate.get(day)
          const selected = selectedDates.includes(day)
          const dateNumber = Number(day.slice(-2))

          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              aria-pressed={selected}
              className={[
                'flex min-h-[58px] flex-col items-center justify-start rounded-xl border px-1 py-2 transition sm:min-h-[72px]',
                selected
                  ? 'border-[#7BAE43] bg-[#E8F4D4] ring-1 ring-[#7BAE43]'
                  : shift
                    ? 'border-[#D4E9BB] bg-[#F0F8E7]'
                    : 'border-transparent bg-white hover:border-[#D4E9BB]',
              ].join(' ')}
            >
              <span className="text-[13px] font-semibold text-[#34452D]">
                {dateNumber}
              </span>

              {shift && (
                <span className="mt-1 rounded-md bg-[#7DAE48] px-1 py-0.5 text-[10px] font-semibold text-white sm:text-[11px]">
                  {shift.attended
                    ? `${getHours(shift).toLocaleString()}h`
                    : '결근'}
                </span>
              )}

              {selected && (
                <span className="mt-1 text-[10px] font-bold text-[#56852B]">
                  선택
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택 현황 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5ECD9] pt-4">
        <div className="flex flex-wrap gap-3 text-[13px]">
          <span className="font-semibold text-[#588B2D]">
            근무 {registeredDays}일
          </span>

          <span className="font-semibold text-[#588B2D]">
            총 {totalHours.toLocaleString('ko-KR')}시간
          </span>
        </div>

        {selectedDates.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1 text-[12px] text-[#697864] hover:text-[#263822]"
          >
            <X size={14} />
            선택 해제
          </button>
        )}
      </div>

      {/* 근무시간 입력 */}
      {selectedDates.length > 0 && draft && (
        <div className="mt-5 rounded-2xl border border-[#DDE9CF] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Clock3
              size={18}
              className="text-[#75A63B]"
            />

            <h4 className="font-bold text-[#263822]">
              {selectedDates.length === 1
                ? `${selectedDate} 근무 설정`
                : `${selectedDates.length}일 일괄 근무 설정`}
            </h4>
          </div>

          {selectedDates.length > 1 && (
            <div className="mb-4 rounded-xl bg-[#F3F8EA] px-4 py-3">
              <p className="text-[12px] leading-5 text-[#5B783E]">
                선택한 {selectedDates.length}일에 동일한
                근무시간을 적용합니다.
              </p>

              <p className="mt-2 break-words text-[12px] text-[#5B783E]">
                {selectedDates
                  .map((date) => `${Number(date.slice(-2))}일`)
                  .join(', ')}
              </p>
            </div>
          )}

          {existingSelectedCount > 0 && (
            <p className="mb-4 rounded-xl bg-[#FFF9E9] px-4 py-3 text-[12px] leading-5 text-[#8B702E]">
              선택한 날짜 중 이미 등록된 날짜가
              {` ${existingSelectedCount}일 `}
              있습니다. 저장하면 해당 날짜의 기존
              근무시간이 새 설정으로 변경됩니다.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] text-[#52624C]">
              출근 시간
              <input
                type="time"
                value={draft.start_time}
                onChange={(event) =>
                  updateDraft({
                    start_time: event.target.value,
                  })
                }
                className="mt-1 block h-11 w-full rounded-xl border border-[#E1E9D8] bg-white px-3 text-[#263822]"
              />
            </label>

            <label className="text-[13px] text-[#52624C]">
              퇴근 시간
              <input
                type="time"
                value={draft.end_time}
                onChange={(event) =>
                  updateDraft({
                    end_time: event.target.value,
                  })
                }
                className="mt-1 block h-11 w-full rounded-xl border border-[#E1E9D8] bg-white px-3 text-[#263822]"
              />
            </label>

            <label className="text-[13px] text-[#52624C]">
              휴게시간 (분)
              <input
                type="number"
                min={0}
                max={1440}
                value={draft.break_minutes}
                onChange={(event) => {
                  const minutes = Math.max(
                    0,
                    Number(event.target.value),
                  )

                  updateDraft({
                    break_minutes: minutes,
                    night_break_minutes: Math.min(
                      draft.night_break_minutes ?? 0,
                      minutes,
                    ),
                  })
                }}
                className="mt-1 block h-11 w-full rounded-xl border border-[#E1E9D8] bg-white px-3 text-[#263822]"
              />
            </label>

            <label className="text-[13px] text-[#52624C]">
              야간 휴게시간 (분)
              <input
                type="number"
                min={0}
                max={draft.break_minutes}
                value={draft.night_break_minutes ?? 0}
                onChange={(event) =>
                  updateDraft({
                    night_break_minutes: Math.min(
                      draft.break_minutes,
                      Math.max(0, Number(event.target.value)),
                    ),
                  })
                }
                className="mt-1 block h-11 w-full rounded-xl border border-[#E1E9D8] bg-white px-3 text-[#263822]"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.is_scheduled}
                onChange={(event) =>
                  updateDraft({
                    is_scheduled: event.target.checked,
                  })
                }
                className="accent-[#7DAE48]"
              />
              소정근로일
            </label>

            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.attended}
                onChange={(event) =>
                  updateDraft({
                    attended: event.target.checked,
                  })
                }
                className="accent-[#7DAE48]"
              />
              실제 출근
            </label>

            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.is_holiday}
                onChange={(event) =>
                  updateDraft({
                    is_holiday: event.target.checked,
                  })
                }
                className="accent-[#7DAE48]"
              />
              휴일근로
            </label>
          </div>

          <p className="mt-4 text-[12px] text-[#7A8573]">
            예상 유급 근무시간:{' '}
            <strong className="text-[#588B2D]">
              {getHours(draft).toLocaleString('ko-KR')}시간
            </strong>
            {selectedDates.length > 1 &&
              ` × ${selectedDates.length}일`}
          </p>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {existingSelectedCount > 0 && (
              <button
                type="button"
                onClick={deleteShifts}
                className="flex items-center gap-1 rounded-xl border border-red-200 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
                {selectedDates.length === 1
                  ? '삭제'
                  : '선택 기록 삭제'}
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-[#E1E9D8] px-4 py-2.5 text-[13px]"
            >
              취소
            </button>

            <button
              type="button"
              onClick={saveShifts}
              className="flex items-center gap-1 rounded-xl bg-[#7DAE48] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#6B9B38]"
            >
              <Plus size={16} />
              {selectedDates.length > 1
                ? `${selectedDates.length}일 일괄 등록`
                : selectedShift
                  ? '수정 완료'
                  : '근무 등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
