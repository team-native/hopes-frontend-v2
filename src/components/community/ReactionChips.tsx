import { Heart, MessageCircle } from 'lucide-react'

interface LikeChipProps {
  count: number
  /** 내가 좋아요를 눌렀는지 */
  liked?: boolean
  disabled?: boolean
  onClick?: () => void
}

/** 하트 + 숫자 (Community/Like Chip). 누르면 좋아요 토글 */
export function LikeChip({ count, liked = false, disabled = false, onClick }: LikeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={`좋아요 ${count}개${liked ? ', 누름' : ''}`}
      className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-caption font-medium transition disabled:cursor-wait disabled:opacity-60 ${
        liked
          ? 'bg-bg-brand-soft text-text-brand'
          : 'border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-canvas'
      }`}
    >
      <Heart className="size-3.5" strokeWidth={1.75} aria-hidden />
      {count}
    </button>
  )
}

interface CommentChipProps {
  count: number
  onClick?: () => void
}

/** 말풍선 + 숫자 (Community/Comment Chip) */
export function CommentChip({ count, onClick }: CommentChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`댓글 ${count}개`}
      className="inline-flex h-7 items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2.5 text-caption font-medium text-text-secondary shadow-cloud-sm transition hover:bg-bg-canvas"
    >
      <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
      {count}
    </button>
  )
}
