import { useEffect, useState } from 'react'

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
  const [inputValue, setInputValue] = useState<string>(
    value == null || !Number.isFinite(value)
      ? ''
      : String(value)
  )

  // 부모 컴포넌트에서 값이 변경되면 입력창에도 반영
  useEffect(() => {
    setInputValue(
      value == null || !Number.isFinite(value)
        ? ''
        : String(value)
    )
  }, [value])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = event.target.value

    // 입력창을 비우는 동작 허용
    if (rawValue === '') {
      setInputValue('')
      onChange(0)
      return
    }

    const nextValue = Number(rawValue)

    if (!Number.isFinite(nextValue)) {
      return
    }

    setInputValue(rawValue)
    onChange(nextValue)
  }

  const handleBlur = () => {
    // 입력이 비어 있으면 최소값으로 복구
    if (inputValue.trim() === '') {
      const fallback = Math.max(min, 0)

      setInputValue(String(fallback))
      onChange(fallback)
      return
    }

    let nextValue = Number(inputValue)

    if (!Number.isFinite(nextValue)) {
      nextValue = min
    }

    if (nextValue < min) {
      nextValue = min
    }

    if (max !== undefined && nextValue > max) {
      nextValue = max
    }

    setInputValue(String(nextValue))

    if (nextValue !== value) {
      onChange(nextValue)
    }
  }

  return (
    <div className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-4">
      <label className="text-[15px] font-medium text-ink">
        {label}
      </label>

      <div className="flex h-[44px] items-center rounded-xl border border-primary-100 bg-transparent px-4 focus-within:border-primary">
        <input
          type="number"
          value={inputValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full min-w-0 bg-transparent text-right text-[15px] text-ink outline-none disabled:opacity-50"
        />

        <span className="ml-3 shrink-0 text-[14px] text-ink-secondary">
          {unit}
        </span>
      </div>
    </div>
  )
}