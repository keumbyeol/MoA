
import { CircleHelp } from 'lucide-react'

import type { WageCalculateRequest } from '../../types/wage'
import WageInputField from './WageInputField'

interface WageAllowanceOptionsProps {
  value: WageCalculateRequest
  onChange: (value: WageCalculateRequest) => void
}

export default function WageAllowanceOptions({
  value,
  onChange,
}: WageAllowanceOptionsProps) {
  const update = (
    changes: Partial<WageCalculateRequest>,
  ) => {
    onChange({ ...value, ...changes })
  }

  const overtimeEnabled = value.weekly_overtime_hours > 0
  const nightEnabled = value.weekly_night_hours > 0
  const holidayEnabled = value.weekly_holiday_work_hours > 0

  return (
    <div className="space-y-4">
      {/* 주휴수당 */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={value.include_weekly_holiday_pay}
          onChange={(event) =>
            update({
              include_weekly_holiday_pay: event.target.checked,
            })
          }
          className="h-5 w-5 accent-primary"
        />

        <span className="text-[15px] text-ink">
          주휴수당 포함
        </span>

        <CircleHelp
          size={17}
          className="text-ink-muted"
          aria-label="주휴수당은 지급 요건을 충족하는 경우 계산됩니다."
        />
      </label>

      {/* 연장근로수당 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={overtimeEnabled}
            onChange={(event) =>
              update({
                weekly_overtime_hours:
                  event.target.checked ? 0.5 : 0,
              })
            }
            className="h-5 w-5 accent-primary"
          />

          <span className="text-[15px] text-ink">
            연장근로수당 포함
          </span>

          <CircleHelp
            size={17}
            className="text-ink-muted"
            aria-label="연장근로시간에 따라 수당이 계산됩니다."
          />
        </label>

        {overtimeEnabled && (
          <div className="mt-3 pl-8">
            <WageInputField
              label="주 연장시간"
              value={value.weekly_overtime_hours}
              unit="시간"
              min={0}
              max={52}
              step={0.5}
              onChange={(hours) =>
                update({
                  weekly_overtime_hours: hours,
                })
              }
            />
          </div>
        )}
      </div>

      {/* 야간근로수당 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={nightEnabled}
            onChange={(event) =>
              update({
                weekly_night_hours:
                  event.target.checked ? 0.5 : 0,
              })
            }
            className="h-5 w-5 accent-primary"
          />

          <span className="text-[15px] text-ink">
            야간근로수당 포함 (22시 ~ 6시)
          </span>

          <CircleHelp
            size={17}
            className="text-ink-muted"
            aria-label="야간근로시간에 따라 수당이 계산됩니다."
          />
        </label>

        {nightEnabled && (
          <div className="mt-3 pl-8">
            <WageInputField
              label="주 야간시간"
              value={value.weekly_night_hours}
              unit="시간"
              min={0}
              max={168}
              step={0.5}
              onChange={(hours) =>
                update({
                  weekly_night_hours: hours,
                })
              }
            />
          </div>
        )}
      </div>

      {/* 휴일근로수당 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={holidayEnabled}
            onChange={(event) =>
              update({
                weekly_holiday_work_hours:
                  event.target.checked ? 0.5 : 0,
              })
            }
            className="h-5 w-5 accent-primary"
          />

          <span className="text-[15px] text-ink">
            휴일근로수당 포함
          </span>

          <CircleHelp
            size={17}
            className="text-ink-muted"
            aria-label="휴일근로시간에 따라 수당이 계산됩니다."
          />
        </label>

        {holidayEnabled && (
          <div className="mt-3 pl-8">
            <WageInputField
              label="주 휴일시간"
              value={value.weekly_holiday_work_hours}
              unit="시간"
              min={0}
              max={168}
              step={0.5}
              onChange={(hours) =>
                update({
                  weekly_holiday_work_hours: hours,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
