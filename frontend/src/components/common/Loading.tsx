
import { LoaderCircle } from 'lucide-react'

type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingProps {
  size?: LoadingSize
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeStyles: Record<LoadingSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export default function Loading({
  size = 'md',
  text = '불러오는 중...',
  fullScreen = false,
  className = '',
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen w-full bg-surface' : 'py-6',
        className,
      ].join(' ')}
    >
      <LoaderCircle
        aria-hidden="true"
        className={[
          'animate-spin text-primary',
          sizeStyles[size],
        ].join(' ')}
      />

      {text && (
        <p className="text-sm font-medium text-ink-secondary">
          {text}
        </p>
      )}

      <span className="sr-only">
        {text || '로딩 중'}
      </span>
    </div>
  )
}
