
interface WageStepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  '근무 조건 입력',
  '수당 조건 설정',
  '결과 확인',
]

export default function WageStepIndicator({
  currentStep,
}: WageStepIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-primary-100 pb-5">
      {steps.map((label, index) => {
        const step = index + 1
        const active = step === currentStep

        return (
          <div
            key={label}
            className={[
              'flex min-w-0 items-center gap-2 rounded-full px-3 py-2',
              active ? 'bg-primary-100' : '',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                active
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-white',
              ].join(' ')}
            >
              {step}
            </span>

            <span
              className={[
                'hidden whitespace-nowrap text-[14px] sm:block',
                active ? 'font-bold text-ink' : 'text-ink-secondary',
              ].join(' ')}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
