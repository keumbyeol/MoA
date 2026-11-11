
import type { HTMLAttributes } from 'react'

type LogoSize = 'sm' | 'md' | 'lg'

export interface LogoProps
  extends HTMLAttributes<HTMLDivElement> {
  size?: LogoSize
  src?: string
  subtitle?: string
}

const imageSizes: Record<LogoSize, string> = {
  sm: 'h-8',
  md: 'h-11',
  lg: 'h-16',
}

export default function Logo({
  size = 'md',
  src = '/images/logo/moa_logo.png',
  subtitle,
  className = '',
  ...props
}: LogoProps) {
  return (
    <div
      className={[
        'inline-flex flex-col items-start',
        className,
      ].join(' ')}
      {...props}
    >
      <img
        src={src}
        alt="MOA 로고"
        className={[
          'w-auto max-w-full object-contain',
          imageSizes[size],
        ].join(' ')}
      />

      {subtitle && (
        <span className="mt-1 text-xs font-medium text-ink-secondary">
          {subtitle}
        </span>
      )}
    </div>
  )
}
