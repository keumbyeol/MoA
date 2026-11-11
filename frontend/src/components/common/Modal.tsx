
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button'

type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  confirmLoading?: boolean
  confirmDisabled?: boolean
  className?: string
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  className = '',
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null

    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    dialog?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmLoading) {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialog) return

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [open, onClose, confirmLoading])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/35"
        aria-hidden="true"
        onClick={() => {
          if (closeOnOverlay && !confirmLoading) {
            onClose()
          }
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={!title ? '안내 창' : undefined}
        tabIndex={-1}
        className={[
          'relative z-10 w-full overflow-hidden',
          'rounded-3xl border border-line bg-surface',
          'p-6 shadow-modal outline-none sm:p-7',
          sizeStyles[size],
          className,
        ].join(' ')}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            disabled={confirmLoading}
            aria-label="모달 닫기"
            className="absolute right-4 top-4 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-green hover:text-ink disabled:opacity-50"
          >
            <X size={20} />
          </button>
        )}

        {title && (
          <h2
            id={titleId}
            className="pr-8 text-xl font-bold text-ink"
          >
            {title}
          </h2>
        )}

        {description && (
          <p
            id={descriptionId}
            className="mt-3 text-sm leading-6 text-ink-secondary"
          >
            {description}
          </p>
        )}

        {children && (
          <div className="mt-5 text-sm text-ink">
            {children}
          </div>
        )}

        {footer !== undefined ? (
          <div className="mt-6">{footer}</div>
        ) : (
          <div className="mt-7 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={confirmLoading}
            >
              {cancelText}
            </Button>

            <Button
              onClick={onConfirm ?? onClose}
              loading={confirmLoading}
              disabled={confirmDisabled}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
