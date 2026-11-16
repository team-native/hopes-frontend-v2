import { Heart, MessageCircle } from 'lucide-react'
import Badge from '../common/Badge'
import type { Post } from './types'

interface PostCardProps {
  post: Post
  onClick?: () => void
}

/** 게시글 목록의 카드 한 개 (Community/Post Card) — 위: 게시판 · 작성자 · 시간 / 좋아요 · 댓글, 아래: 제목 · 내용 한 줄 */
function PostCard({ post, onClick }: PostCardProps) {
  return (
    <article>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border-subtle bg-bg-surface p-md text-left shadow-cloud-sm transition hover:border-border-brand"
      >
        <div className="flex items-center justify-between gap-sm">
          <div className="flex min-w-0 items-center gap-xs">
            <Badge>{post.board}</Badge>
            <span className="truncate text-caption text-text-tertiary">
              {post.authorCohort} · {post.timeAgo}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-2.5 text-caption text-text-tertiary">
            <span className="flex items-center gap-1" aria-label={`좋아요 ${post.likeCount}개`}>
              <Heart className="size-3.5" strokeWidth={1.75} aria-hidden />
              {post.likeCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`댓글 ${post.commentCount}개`}>
              <MessageCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
              {post.commentCount}
            </span>
          </span>
        </div>
        <h3 className="mt-sm truncate text-body font-medium">{post.title}</h3>
        <p className="mt-0.5 truncate text-label text-text-secondary">{post.content}</p>
      </button>
    </article>
  )
}

export default PostCard
