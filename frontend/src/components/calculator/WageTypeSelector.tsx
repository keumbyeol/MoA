
import type { EmploymentType } from '../../types/wage'

interface WageTypeSelectorProps {
  value: EmploymentType
  onChange: (value: EmploymentType) => void
}

const options = [
  { label: '아르바이트', value: 'HOURLY', disabled: false },
  { label: '정규직', value: 'FULL_TIME', disabled: true },
  { label: '계약직', value: 'CONTRACT', disabled: true },
  { label: '기타', value: 'OTHER', disabled: true },
] as const

export default function WageTypeSelector({
  value,
  onChange,
}: WageTypeSelectorProps) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-primary-100 bg-surface-muted p-1">
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => {
              if (option.value === 'HOURLY') {
                onChange(option.value)
              }
            }}
            aria-pressed={selected}
            title={
              option.disabled
                ? '추후 지원 예정입니다.'
                : undefined
            }
            className={[
              'min-h-[42px] rounded-lg px-2 text-[14px] font-semibold transition-colors',
              selected
                ? 'bg-primary text-white shadow-sm'
                : option.disabled
                  ? 'cursor-not-allowed text-ink-muted opacity-40'
                  : 'text-ink hover:bg-primary-50',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
