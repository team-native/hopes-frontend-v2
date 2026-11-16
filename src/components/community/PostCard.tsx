import { Heart, MessageCircle } from 'lucide-react'
import Badge from '../common/Badge'
import type { Post } from './types'

interface PostCardProps {
  post: Post
  onClick?: () => void
}

/** 게시글 목록의 카드 한 개 (Community/Post Card) */
function PostCard({ post, onClick }: PostCardProps) {
  return (
    <article>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border-subtle bg-bg-surface p-md text-left shadow-cloud-sm transition hover:border-border-brand"
      >
        <Badge>{post.board}</Badge>
        <h3 className="mt-2.5 truncate text-label-strong">{post.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-caption text-text-secondary">{post.content}</p>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-tertiary">
          <span>
            {post.authorCohort} · {post.timeAgo}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-0.5" aria-label={`좋아요 ${post.likeCount}개`}>
              <Heart className="size-3" strokeWidth={1.75} aria-hidden />
              {post.likeCount}
            </span>
            <span className="flex items-center gap-0.5" aria-label={`댓글 ${post.commentCount}개`}>
              <MessageCircle className="size-3" strokeWidth={1.75} aria-hidden />
              {post.commentCount}
            </span>
          </span>
        </div>
      </button>
    </article>
  )
}

export default PostCard
