import { Ellipsis } from 'lucide-react'
import Badge from '../common/Badge'
import { CommentChip, LikeChip } from './ReactionChips'
import type { Post } from './types'

interface PostDetailProps {
  post: Post
  onToggleLike?: () => void
  likeDisabled?: boolean
  onCommentClick?: () => void
  /** 오른쪽 위 ⋯ 버튼 (수정 · 삭제 · 신고 메뉴 등) */
  onMoreClick?: () => void
}

/** 게시글 본문 카드 (Community/Post Detail) */
function PostDetail({ post, onToggleLike, likeDisabled, onCommentClick, onMoreClick }: PostDetailProps) {
  return (
    <article className="rounded-lg border border-border-subtle bg-bg-surface p-lg shadow-cloud-sm">
      <div className="flex items-center justify-between">
        <Badge>{post.board}</Badge>
        <button
          type="button"
          onClick={onMoreClick}
          aria-label="더 보기"
          className="-mr-1.5 flex size-7 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
        >
          <Ellipsis className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <h2 className="mt-2.5 text-body-strong">{post.title}</h2>
      <p className="mt-1 text-[11px] text-text-tertiary">
        {post.authorCohort} · {post.timeAgo}
      </p>
      <p className="mt-2.5 text-label whitespace-pre-wrap text-text-primary">{post.content}</p>
      <div className="mt-md flex gap-1.5">
        <LikeChip count={post.likeCount} liked={post.liked} disabled={likeDisabled} onClick={onToggleLike} />
        <CommentChip count={post.commentCount} onClick={onCommentClick} />
      </div>
    </article>
  )
}

export default PostDetail
