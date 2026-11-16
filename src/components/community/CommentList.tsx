import { Ellipsis } from 'lucide-react'
import type { Comment } from './types'

interface CommentListProps {
  comments: Comment[]
  /** 댓글 오른쪽 ⋯ 버튼 */
  onMoreClick?: (comment: Comment) => void
}

/** 댓글 목록 카드 (Community/Comment List) */
function CommentList({ comments, onMoreClick }: CommentListProps) {
  return (
    <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-surface px-md shadow-cloud-sm">
      {comments.map((comment) => (
        <li key={comment.id} className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-caption">
              <span className={`font-semibold ${comment.isMine ? 'text-text-brand' : 'text-text-primary'}`}>
                {comment.authorCohort}
                {comment.isMine && ' (나)'}
              </span>
              <span className="text-[11px] text-text-tertiary"> · {comment.timeAgo}</span>
            </p>
            <button
              type="button"
              onClick={() => onMoreClick?.(comment)}
              aria-label="댓글 더 보기"
              className="-mr-1.5 flex size-6 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
            >
              <Ellipsis className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <p className="mt-1 text-caption whitespace-pre-wrap text-text-primary">{comment.content}</p>
        </li>
      ))}
    </ul>
  )
}

export default CommentList
