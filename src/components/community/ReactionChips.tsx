import { Heart, MessageCircle } from 'lucide-react'
import useLikePop from '../../hooks/useLikePop'

interface LikeHeartProps {
  liked: boolean
  /** useLikePop의 값 — 바뀔 때마다 한 번 튀어 올라요 (0이면 모션 없음) */
  popKey: number
  className?: string
}

/** 좋아요 하트 아이콘 — 누르면 파랗게 채워지고, popKey가 바뀌면 통통 튀어요 */
export function LikeHeart({ liked, popKey, className = 'size-3.5' }: LikeHeartProps) {
  return (
    <span className="relative inline-flex">
      {/* key가 바뀌면 다시 그려져서 모션이 처음부터 다시 재생돼요 */}
      <span key={popKey} className={`inline-flex ${popKey > 0 ? 'animate-like-pop' : ''}`}>
        <Heart
          className={`${className} transition-colors ${liked ? 'fill-current text-icon-brand' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
      {popKey > 0 && liked && (
        <span
          key={`burst-${popKey}`}
          className="pointer-events-none absolute inset-0 animate-like-burst rounded-full bg-bg-brand"
          aria-hidden
        />
      )}
    </span>
  )
}

interface LikeChipProps {
  count: number
  /** 내가 좋아요를 눌렀는지 */
  liked?: boolean
  disabled?: boolean
  /** false를 돌려주면(요청 진행 중이라 무시) 하트 모션도 재생하지 않아요 */
  onClick?: () => boolean | void
}

/** 하트 + 숫자 (Community/Like Chip). 누르면 좋아요 토글 */
export function LikeChip({ count, liked = false, disabled = false, onClick }: LikeChipProps) {
  const [popKey, pop] = useLikePop()
  return (
    <button
      type="button"
      onClick={() => {
        if (onClick?.() !== false && !liked) pop()
      }}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={`좋아요 ${count}개${liked ? ', 누름' : ''}`}
      className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-caption font-medium transition duration-150 active:scale-95 disabled:cursor-wait disabled:opacity-60 ${
        liked
          ? 'bg-bg-brand-soft text-text-brand'
          : 'border border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-canvas'
      }`}
    >
      <LikeHeart liked={liked} popKey={popKey} />
      <span className="tabular-nums">{count}</span>
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
      className="inline-flex h-7 items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2.5 text-caption font-medium text-text-secondary shadow-cloud-sm transition duration-150 hover:bg-bg-canvas active:scale-95"
    >
      <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
      {count}
    </button>
  )
}
