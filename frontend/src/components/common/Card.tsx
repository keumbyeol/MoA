
import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

type CardVariant = 'default' | 'soft' | 'green' | 'outline'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
  title?: string
  description?: string
  action?: ReactNode
  children?: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-line bg-surface shadow-card',
  soft: 'border-line-light bg-surface-soft',
  green: 'border-primary-200 bg-surface-green',
  outline: 'border-line bg-transparent',
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
}

export default function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-card border',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable
          ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {(title || description || action) && (
        <div className={children ? 'mb-4' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-ink">
                  {title}
                </h3>
              )}

              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                  {description}
                </p>
              )}
            </div>

            {action}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
