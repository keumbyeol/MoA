
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftIcon,
      fullWidth = true,
      type = 'text',
      required,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    const actualType =
      isPassword && showPassword ? 'text' : type

    const descriptionId = error || helperText
      ? `${inputId}-description`
      : undefined

    return (
      <div className={fullWidth ? 'w-full' : 'w-auto'}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-ink"
          >
            {label}
            {required && (
              <span className="ml-1 text-danger" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
            className={[
              'min-h-11 w-full rounded-input border bg-surface',
              'px-4 py-3 text-sm text-ink',
              'placeholder:text-ink-muted',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:bg-surface-muted',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/15'
                : 'border-line focus:border-primary focus:ring-primary/15',
              leftIcon ? 'pl-11' : '',
              isPassword ? 'pr-12' : '',
              className,
            ].join(' ')}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={disabled}
              aria-label={
                showPassword ? '비밀번호 숨기기' : '비밀번호 표시'
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 flex items-center justify-center px-1 text-ink-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={descriptionId}
            className={[
              'mt-1.5 text-xs',
              error ? 'text-danger' : 'text-ink-secondary',
            ].join(' ')}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
