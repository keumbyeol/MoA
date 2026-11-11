
interface WageInputFieldProps {
  label: string
  value: number
  unit: string
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

export default function WageInputField({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
}: WageInputFieldProps) {
  return (
    <div className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-4">
      <label className="text-[15px] font-medium text-ink">
        {label}
      </label>

      <div className="flex h-[44px] items-center rounded-xl border border-primary-100 bg-transparent px-4 focus-within:border-primary">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => {
            const next = Number(event.target.value)

            if (Number.isFinite(next)) {
              onChange(next)
            }
          }}
          className="w-full min-w-0 bg-transparent text-right text-[15px] text-ink outline-none disabled:opacity-50"
        />

        <span className="ml-3 shrink-0 text-[14px] text-ink-secondary">
          {unit}
        </span>
      </div>
    </div>
  )
}
