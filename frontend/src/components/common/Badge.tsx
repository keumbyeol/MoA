
import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'

type BadgeSize = 'sm' | 'md'

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  outlined?: boolean
  children: ReactNode
}

const filledStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-muted text-ink-secondary',
}

const outlinedStyles: Record<BadgeVariant, string> = {
  primary: 'border-primary text-primary-700',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
  info: 'border-info text-info',
  neutral: 'border-line-strong text-ink-secondary',
}

export default function Badge({
  variant = 'primary',
  size = 'sm',
  outlined = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'rounded-full font-semibold',
        outlined
          ? `border bg-transparent ${outlinedStyles[variant]}`
          : filledStyles[variant],
        size === 'sm'
          ? 'px-2.5 py-1 text-xs'
          : 'px-3.5 py-1.5 text-sm',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
