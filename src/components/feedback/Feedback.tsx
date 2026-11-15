import { CircleAlert, Info, MessageCircle, type LucideIcon } from 'lucide-react'
import Button from '../common/Button'

interface NoticeRowProps {
  message: string
  actionText?: string
  onAction?: () => void
}

/** 연파랑 안내 줄 + 오른쪽 버튼 (Notify/Notice Row) */
export function NoticeRow({ message, actionText, onAction }: NoticeRowProps) {
  return (
    <div role="status" className="flex items-center gap-2.5 rounded-md bg-bg-brand-soft px-md py-3">
      <Info className="size-4 shrink-0 text-icon-brand" strokeWidth={1.75} aria-hidden />
      <p className="min-w-0 flex-1 text-[11px] leading-4 whitespace-pre-line text-text-secondary">{message}</p>
      {actionText && (
        <button type="button" onClick={onAction} className="shrink-0 text-caption font-semibold text-text-brand hover:underline">
          {actionText}
        </button>
      )}
    </div>
  )
}

interface InlineErrorProps {
  title: string
  description?: string
  retryText?: string
  onRetry?: () => void
}

/** 빨간 제목 + 설명 + 다시 시도 (Feedback/Inline Error) */
export function InlineError({ title, description, retryText = '다시 시도', onRetry }: InlineErrorProps) {
  return (
    <div role="alert">
      <p className="flex items-center gap-1.5 text-label-strong text-text-danger">
        <CircleAlert className="size-4 shrink-0 text-icon-danger" strokeWidth={1.75} aria-hidden />
        {title}
      </p>
      {description && <p className="mt-1.5 text-caption text-text-secondary">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-1.5 text-caption text-text-tertiary underline-offset-2 hover:underline">
          {retryText}
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  actionText?: string
  onAction?: () => void
}

/** 내용이 없을 때 가운데 안내 (Feedback/Empty State) */
export function EmptyState({ title, description, icon: Icon = MessageCircle, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-md text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-border-subtle bg-bg-surface shadow-cloud-sm" aria-hidden>
        <Icon className="size-6 text-icon-brand" strokeWidth={1.75} />
      </span>
      <p className="mt-md text-label-strong">{title}</p>
      {description && <p className="mt-1 text-caption text-text-secondary">{description}</p>}
      {actionText && (
        <Button size="sm" className="mt-sm h-8 px-3 text-caption" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}
