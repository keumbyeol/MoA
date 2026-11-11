
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Trash2,
} from 'lucide-react'

import type { WorkShift } from '../../types/wage'

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

  return Math.max(0, (minutes - shift.break_minutes) / 60)
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
  const [selectedDate, setSelectedDate] = useState<string | null>(
    null,
  )

  useEffect(() => {
    setSelectedDate(null)
  }, [year, month])

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

  const selectedShift = shifts.find(
    (shift) => shift.work_date === selectedDate,
  )

  const [draft, setDraft] = useState<WorkShift | null>(null)

  useEffect(() => {
    if (!selectedDate) {
      setDraft(null)
      return
    }

    const existing = shifts.find(
      (shift) => shift.work_date === selectedDate,
    )

    setDraft(existing ? { ...existing } : makeShift(selectedDate))
  }, [selectedDate, shifts])

  const changeMonth = (offset: number) => {
    const next = new Date(year, month - 1 + offset, 1)

    onMonthChange(
      next.getFullYear(),
      next.getMonth() + 1,
    )
  }

  const saveShift = () => {
    if (!draft) return

    const hours = getHours(draft)

    if (draft.attended && hours <= 0) {
      window.alert(
        '출퇴근 시간과 휴게시간을 확인해주세요.',
      )
      return
    }

    const next = [
      ...shifts.filter(
        (shift) => shift.work_date !== draft.work_date,
      ),
      draft,
    ].sort((a, b) =>
      a.work_date.localeCompare(b.work_date),
    )

    onChange(next)
    setSelectedDate(null)
  }

  const deleteShift = () => {
    if (!selectedDate) return

    onChange(
      shifts.filter(
        (shift) => shift.work_date !== selectedDate,
      ),
    )
    setSelectedDate(null)
  }

  const updateDraft = (changes: Partial<WorkShift>) => {
    setDraft((prev) =>
      prev ? { ...prev, ...changes } : prev,
    )
  }

  const totalHours = shifts.reduce(
    (sum, shift) => sum + getHours(shift),
    0,
  )

  const registeredDays = shifts.filter(
    (shift) => shift.attended,
  ).length

  return (
    <div className="rounded-[22px] border border-[#E5ECD9] bg-[#FBFCF7] p-4 sm:p-5">
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

        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[58px]"
              />
            )
          }

          const shift = shifts.find(
            (item) => item.work_date === day,
          )

          const selected = selectedDate === day
          const dateNumber = Number(day.slice(-2))

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={[
                'flex min-h-[58px] flex-col items-center justify-start rounded-xl border px-1 py-2 transition sm:min-h-[72px]',
                selected
                  ? 'border-[#7BAE43] bg-[#E8F4D4]'
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
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5ECD9] pt-4 text-[13px]">
        <span className="text-[#697864]">
          날짜를 선택해 근무시간을 등록하세요.
        </span>

        <div className="flex gap-4 font-semibold text-[#588B2D]">
          <span>근무 {registeredDays}일</span>
          <span>총 {totalHours.toLocaleString()}시간</span>
        </div>
      </div>

      {selectedDate && draft && (
        <div className="mt-5 rounded-2xl border border-[#DDE9CF] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 size={18} className="text-[#75A63B]" />
            <h4 className="font-bold text-[#263822]">
              {selectedDate} 근무 설정
            </h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] text-[#52624C]">
              출근 시간
              <input
                type="time"
                value={draft.start_time}
                onChange={(e) =>
                  updateDraft({
                    start_time: e.target.value,
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
                onChange={(e) =>
                  updateDraft({
                    end_time: e.target.value,
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
                onChange={(e) =>
                  updateDraft({
                    break_minutes: Math.max(
                      0,
                      Number(e.target.value),
                    ),
                  })
                }
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
                onChange={(e) =>
                  updateDraft({
                    night_break_minutes: Math.max(
                      0,
                      Number(e.target.value),
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
                onChange={(e) =>
                  updateDraft({
                    is_scheduled: e.target.checked,
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
                onChange={(e) =>
                  updateDraft({
                    attended: e.target.checked,
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
                onChange={(e) =>
                  updateDraft({
                    is_holiday: e.target.checked,
                  })
                }
                className="accent-[#7DAE48]"
              />
              휴일근로
            </label>
          </div>

          <p className="mt-3 text-[12px] text-[#7A8573]">
            예상 유급 근무시간: {getHours(draft).toLocaleString()}시간
          </p>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {selectedShift && (
              <button
                type="button"
                onClick={deleteShift}
                className="flex items-center gap-1 rounded-xl border border-red-200 px-4 py-2.5 text-[13px] text-red-600"
              >
                <Trash2 size={15} />
                삭제
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded-xl border border-[#E1E9D8] px-4 py-2.5 text-[13px]"
            >
              취소
            </button>

            <button
              type="button"
              onClick={saveShift}
              className="flex items-center gap-1 rounded-xl bg-[#7DAE48] px-4 py-2.5 text-[13px] font-bold text-white"
            >
              <Plus size={16} />
              {selectedShift ? '수정 완료' : '근무 등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
