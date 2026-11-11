
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { LoaderCircle } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-white hover:bg-primary-dark',

  secondary:
    'border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200',

  outline:
    'border-line-strong bg-surface text-ink hover:bg-surface-green',

  ghost:
    'border-transparent bg-transparent text-ink-secondary hover:bg-primary-50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-xs',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'rounded-button border font-semibold',
          'transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}

        {children}

        {!loading && rightIcon}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
