import { MessageCircle } from 'lucide-react'
import Badge from '../common/Badge'
import useLikePop from '../../hooks/useLikePop'
import { LikeHeart } from './ReactionChips'
import type { Post } from './types'

interface PostCardProps {
  post: Post
  /** 카드를 누르면 (게시글 열기) */
  onClick?: () => void
  /**
   * 넘기면 하트를 눌러 바로 좋아요할 수 있어요.
   * false를 돌려주면(요청 진행 중이라 무시) 하트 모션도 재생하지 않아요.
   */
  onToggleLike?: () => boolean | void
}

/** 게시글 목록의 카드 한 개 (Community/Post Card) — 위: 게시판 · 작성자 · 시간 / 좋아요 · 댓글, 아래: 제목 · 내용 한 줄 */
function PostCard({ post, onClick, onToggleLike }: PostCardProps) {
  const [popKey, pop] = useLikePop()
  const liked = Boolean(post.liked)
  const likeLabel = `좋아요 ${post.likeCount}개${liked ? ', 누름' : ''}`

  return (
    // 카드 전체가 눌리도록 제목 버튼을 카드 크기로 늘리고(after:inset-0), 하트 버튼만 그 위(z-10)에 둬요
    <article className="group relative rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-border-brand hover:shadow-cloud-md has-[:active]:translate-y-0 has-[:focus-visible]:border-border-brand">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex min-w-0 items-center gap-xs">
          <Badge>{post.board}</Badge>
          <span className="truncate text-caption text-text-tertiary">
            {post.authorCohort} · {post.timeAgo}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-caption text-text-tertiary">
          {onToggleLike ? (
            <button
              type="button"
              onClick={() => {
                if (onToggleLike() !== false && !liked) pop()
              }}
              aria-pressed={liked}
              aria-label={likeLabel}
              className={`relative z-10 -my-1 flex h-7 items-center gap-1 rounded-full px-1.5 transition duration-150 hover:bg-bg-brand-soft hover:text-text-brand active:scale-90 ${
                liked ? 'text-text-brand' : ''
              }`}
            >
              <LikeHeart liked={liked} popKey={popKey} />
              <span className="tabular-nums">{post.likeCount}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-1.5" aria-label={likeLabel}>
              <LikeHeart liked={liked} popKey={0} />
              {post.likeCount}
            </span>
          )}
          <span className="flex items-center gap-1" aria-label={`댓글 ${post.commentCount}개`}>
            <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
            {post.commentCount}
          </span>
        </span>
      </div>
      <h3 className="mt-sm truncate text-body font-medium">
        <button
          type="button"
          onClick={onClick}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
        >
          {post.title}
        </button>
      </h3>
      <p className="mt-0.5 truncate text-label text-text-secondary">{post.content}</p>
    </article>
  )
}

export default PostCard
