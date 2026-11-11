
import type { ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { X } from 'lucide-react'

export type MessageType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

interface ToastContentProps {
  id: string | number
  type: MessageType
  text: string
}

const messageStyles: Record<MessageType, string> = {
  success:
    'border-message-success text-message-success-text',

  error:
    'border-message-error text-message-error-text',

  warning:
    'border-message-warning text-message-warning-text',

  info:
    'border-message-info text-message-info-text',
}

function ToastContent({
  id,
  type,
  text,
}: ToastContentProps) {
  return (
    <div
      className={[
        'flex w-full items-center justify-between gap-3',
        'rounded-2xl border bg-surface px-5 py-3',
        'shadow-soft',
        messageStyles[type],
      ].join(' ')}
    >
      <span className="min-w-0 flex-1 break-words text-center text-sm font-medium leading-relaxed">
        {text}
      </span>

      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="알림 닫기"
        className="shrink-0 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={15} />
      </button>
    </div>
  )
}

interface ShowMessageOptions {
  duration?: number
}

function showMessage(
  type: MessageType,
  text: string,
  options: ShowMessageOptions = {},
) {
  return toast.custom(
    (id) => (
      <ToastContent
        id={id}
        type={type}
        text={text}
      />
    ),
    {
      duration: options.duration ?? 3000,
    },
  )
}

export const message = {
  success: (text: string, options?: ShowMessageOptions) =>
    showMessage('success', text, options),

  error: (text: string, options?: ShowMessageOptions) =>
    showMessage('error', text, options),

  warning: (text: string, options?: ShowMessageOptions) =>
    showMessage('warning', text, options),

  info: (text: string, options?: ShowMessageOptions) =>
    showMessage('info', text, options),

  dismiss: (id?: string | number) =>
    toast.dismiss(id),
}

export interface MessageProviderProps {
  children: ReactNode
}

export default function MessageProvider({
  children,
}: MessageProviderProps) {
  return (
    <>
      {children}

      <Toaster
        position="top-center"
        duration={3000}
        visibleToasts={4}
        gap={10}
        offset={24}
        mobileOffset={16}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'w-full',
          },
        }}
        style={{
          width: 'min(90vw, 380px)',
        }}
      />
    </>
  )
}
