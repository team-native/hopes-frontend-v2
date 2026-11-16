import { ArrowLeft, CircleAlert, Flag, Info, Pencil, Search, Trash2 } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import SearchField from '../../components/common/SearchField'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import CommentList from '../../components/community/CommentList'
import PostCard from '../../components/community/PostCard'
import PostDetail from '../../components/community/PostDetail'
import type { Comment, Post } from '../../components/community/types'
import WritePostModal, { type WritePostValues } from '../../components/community/WritePostModal'
import { EmptyState } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import SectionHeader from '../../components/layout/SectionHeader'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import {
  boards,
  mockCommunityPosts,
  type Board,
  type CommunityComment,
  type CommunityPost,
} from '../../mocks/community'
import { createId } from '../../utils/id'

const SORT_OPTIONS = ['최신순', '인기순'] as const
type SortOrder = (typeof SORT_OPTIONS)[number]

const reportReasons = ['욕설·비방', '도배·광고', '개인정보 노출', '부적절한 내용', '기타']

/** 게시글을 공통 PostCard · PostDetail이 받는 모양으로 바꿔요 */
function toPost(post: CommunityPost, isMine: boolean): Post {
  return {
    id: post.id,
    board: post.board,
    title: post.title,
    content: post.content,
    authorCohort: isMine ? `${post.authorCohort} (나)` : post.authorCohort,
    timeAgo: post.time,
    likeCount: post.likes,
    commentCount: post.comments.length,
    liked: post.likedByMe,
  }
}

type ModalState =
  | { type: 'write' }
  | { type: 'edit'; postId: string }
  | { type: 'postMenu'; postId: string }
  | { type: 'deletePost'; postId: string }
  | { type: 'deleteComment'; postId: string; commentId: string }
  | { type: 'report'; target: '게시글' | '댓글' }
  | null

function CommunityPage() {
  const { profile } = useProfile()
  const { toast, showToast } = useToast()
  // 열린 게시글은 주소(?post=id)로 관리해요. 사이드바의 커뮤니티 메뉴를 누르면 목록으로 돌아가요.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPostId = searchParams.get('post')
  const showErrorPreview = searchParams.get('state') === 'error'

  const [posts, setPosts] = useState(mockCommunityPosts)
  const [selectedBoard, setSelectedBoard] = useState<Board>('전체')
  const [sortOrder, setSortOrder] = useState<SortOrder>('최신순')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [reportReason, setReportReason] = useState(reportReasons[1])
  const [commentDraft, setCommentDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // TODO: API 연동 시 본인 여부는 서버가 판단해 내려준다(isMine). 클라이언트 판단은 표시용일 뿐 권한 검사가 아니다.
  const isMine = (authorId: string) => authorId === profile.id
  const myBoard = boards.find((board) => board === profile.generation) ?? '전체'

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = posts.filter((post) => {
      const boardMatches = selectedBoard === '전체' || post.board === selectedBoard || post.board === '전체'
      const searchMatches = !query || `${post.title} ${post.content}`.toLowerCase().includes(query)
      return boardMatches && searchMatches
    })
    return sortOrder === '인기순' ? [...matching].sort((a, b) => b.likes - a.likes) : matching
  }, [posts, search, selectedBoard, sortOrder])

  const popularPosts = useMemo(() => [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3), [posts])
  const selectedPost = posts.find((post) => post.id === selectedPostId)
  const editingPost = modal?.type === 'edit' ? posts.find((post) => post.id === modal.postId) : undefined
  const myPostCount = posts.filter((post) => isMine(post.authorId)).length
  const myCommentCount = posts.reduce(
    (count, post) => count + post.comments.filter((comment) => isMine(comment.authorId)).length,
    0,
  )

  function openPost(postId: string | null) {
    setCommentDraft('')
    setSearchParams(postId ? { post: postId } : {})
  }

  function submitPost(values: WritePostValues) {
    const board = values.board as Board
    if (modal?.type === 'edit') {
      // 게시판 · 제목 · 내용만 수정한다. 작성자 기수는 작성 시점 값을 유지한다.
      setPosts((current) =>
        current.map((post) =>
          post.id === modal.postId && isMine(post.authorId)
            ? { ...post, board, title: values.title, content: values.content }
            : post,
        ),
      )
      showToast('게시글을 수정했어요')
      return
    }

    const newPost: CommunityPost = {
      id: createId('post'),
      board,
      authorId: profile.id,
      // 작성자 기수는 사용자가 고르지 않고 로그인 정보로 정한다. (API 연동 시 서버가 결정)
      authorCohort: profile.generation,
      time: '방금',
      title: values.title,
      content: values.content,
      likes: 0,
      likedByMe: false,
      comments: [],
    }
    setPosts((current) => [newPost, ...current])
    setSelectedBoard('전체')
    setSearch('')
    showToast('게시글을 등록했어요')
  }

  function toggleLike(postId: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likedByMe: !post.likedByMe, likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)) }
          : post,
      ),
    )
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPost || !commentDraft.trim()) return
    const newComment: CommunityComment = {
      id: createId('comment'),
      authorId: profile.id,
      authorCohort: profile.generation,
      time: '방금',
      content: commentDraft.trim(),
    }
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedPost.id ? { ...post, comments: [...post.comments, newComment] } : post,
      ),
    )
    setCommentDraft('')
  }

  function confirmDeletePost(postId: string) {
    const target = posts.find((post) => post.id === postId)
    if (target && isMine(target.authorId)) {
      setPosts((current) => current.filter((post) => post.id !== target.id))
      if (selectedPostId === target.id) openPost(null)
      showToast('게시글을 삭제했어요')
    }
    setModal(null)
  }

  function confirmDeleteComment(postId: string, commentId: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId || !isMine(comment.authorId)),
            }
          : post,
      ),
    )
    setModal(null)
    showToast('댓글을 삭제했어요')
  }

  function submitReport() {
    // TODO: 신고 API 연동 후 실제 접수 및 성공/실패 처리
    setModal(null)
    showToast('신고 기능은 준비 중이라 접수되지 않았어요')
  }

  function handleCommentMore(comment: Comment) {
    if (!selectedPost) return
    if (comment.isMine) setModal({ type: 'deleteComment', postId: selectedPost.id, commentId: comment.id })
    else setModal({ type: 'report', target: '댓글' })
  }

  function retryFeed() {
    setSearchParams({})
    setLoading(true)
    window.setTimeout(() => setLoading(false), 500)
  }

  return (
    <AppLayout activeMenu="community">
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-5 md:px-8 md:py-6">
        {selectedPost ? (
          <div className="mx-auto max-w-[760px] space-y-sm">
            <button
              type="button"
              onClick={() => openPost(null)}
              className="flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
              {selectedPost.board} 게시판
            </button>
            <PostDetail
              post={toPost(selectedPost, isMine(selectedPost.authorId))}
              onToggleLike={() => toggleLike(selectedPost.id)}
              onCommentClick={() => commentInputRef.current?.focus()}
              onMoreClick={() => setModal({ type: 'postMenu', postId: selectedPost.id })}
            />
            <SectionHeader title={`댓글 ${selectedPost.comments.length}`} className="pt-xs" />
            {selectedPost.comments.length > 0 ? (
              <CommentList
                comments={selectedPost.comments.map((comment) => ({
                  id: comment.id,
                  authorCohort: comment.authorCohort,
                  timeAgo: comment.time,
                  content: comment.content,
                  isMine: isMine(comment.authorId),
                }))}
                onMoreClick={handleCommentMore}
              />
            ) : (
              <p className="py-sm text-caption text-text-secondary">첫 댓글을 남겨 보세요.</p>
            )}
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                ref={commentInputRef}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="댓글 달기"
                aria-label="댓글 달기"
                className="h-11 min-w-0 flex-1 rounded-full border border-border-default bg-bg-surface px-4 text-label transition outline-none placeholder:text-text-tertiary focus:border-border-brand"
              />
              <Button size="sm" type="submit" className="h-11" disabled={!commentDraft.trim()}>
                등록
              </Button>
            </form>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-title">커뮤니티</h1>
                <p className="mt-1 text-caption text-text-secondary">
                  기수와 상관없이 모든 게시판을 읽고 쓸 수 있어요. 작성자는 기수만 표시돼요.
                </p>
              </div>
              <div className="flex gap-2">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="제목·내용 검색"
                  className="min-w-0 flex-1 sm:w-64 sm:flex-none"
                />
                <Button size="sm" className="h-11" onClick={() => setModal({ type: 'write' })}>
                  <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                  글쓰기
                </Button>
              </div>
            </header>

            <div className="mt-lg flex flex-wrap items-center justify-between gap-sm">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="게시판">
                {boards.map((board) => (
                  <button
                    key={board}
                    type="button"
                    onClick={() => setSelectedBoard(board)}
                    aria-pressed={selectedBoard === board}
                    className={`h-8 rounded-full border px-3 text-caption transition ${
                      selectedBoard === board
                        ? 'border-border-brand bg-bg-brand-soft font-medium text-text-brand'
                        : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-brand'
                    }`}
                  >
                    {board}
                  </button>
                ))}
              </div>
              <Select
                variant="inline"
                label="정렬"
                placeholder="선택"
                options={SORT_OPTIONS}
                value={sortOrder}
                onChange={(value) => setSortOrder(value as SortOrder)}
                className="w-[160px]"
              />
            </div>

            <div className="mt-md grid grid-cols-1 items-start gap-lg lg:grid-cols-[minmax(0,1fr)_260px]">
              <section className="space-y-sm" aria-label="게시글 목록">
                {loading ? (
                  <PostSkeletons />
                ) : showErrorPreview ? (
                  <div className="py-3xl">
                    <EmptyState
                      icon={CircleAlert}
                      title="게시글을 불러오지 못했어요"
                      description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                      actionText="다시 시도"
                      onAction={retryFeed}
                    />
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={toPost(post, isMine(post.authorId))}
                      onClick={() => openPost(post.id)}
                    />
                  ))
                ) : (
                  <div className="py-3xl">
                    {search.trim() ? (
                      <EmptyState
                        icon={Search}
                        title="검색 결과가 없어요"
                        description="다른 단어로 검색하거나 게시판을 바꿔 보세요."
                      />
                    ) : (
                      <EmptyState
                        title="아직 게시글이 없어요"
                        description={`${selectedBoard} 게시판의 첫 글을 남겨보세요.`}
                        actionText="글쓰기"
                        onAction={() => setModal({ type: 'write' })}
                      />
                    )}
                  </div>
                )}
              </section>

              <aside className="space-y-md">
                <section className="rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
                  <h2 className="mb-2 text-caption font-medium text-text-secondary">이번 주 인기글</h2>
                  <ol>
                    {popularPosts.map((post, index) => (
                      <li key={post.id} className="border-b border-border-subtle last:border-0">
                        <button
                          type="button"
                          onClick={() => openPost(post.id)}
                          className="flex min-h-10 w-full items-center gap-2 text-left"
                        >
                          <span className="text-caption font-medium text-text-brand">{index + 1}</span>
                          <span className="truncate text-caption font-medium">{post.title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
                  <h2 className="mb-3 text-caption font-medium text-text-secondary">내 활동</h2>
                  <dl className="flex gap-xl">
                    <div>
                      <dd className="text-heading tabular-nums">{myPostCount}</dd>
                      <dt className="text-caption text-text-secondary">작성글</dt>
                    </div>
                    <div>
                      <dd className="text-heading tabular-nums">{myCommentCount}</dd>
                      <dt className="text-caption text-text-secondary">댓글</dt>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>

      <WritePostModal
        open={modal?.type === 'write' || modal?.type === 'edit'}
        onClose={() => setModal(null)}
        boards={boards}
        defaultBoard={myBoard}
        mode={modal?.type === 'edit' ? 'edit' : 'create'}
        initialValues={editingPost}
        authorNotice={`작성자는 내 기수(${profile.generation})로만 표시돼요. 이름·학번은 공개되지 않아요.`}
        onSubmit={submitPost}
      />

      <PostMenuDialog
        open={modal?.type === 'postMenu'}
        isMyPost={modal?.type === 'postMenu' && isMine(posts.find((post) => post.id === modal.postId)?.authorId ?? '')}
        onClose={() => setModal(null)}
        onEdit={() => modal?.type === 'postMenu' && setModal({ type: 'edit', postId: modal.postId })}
        onDelete={() => modal?.type === 'postMenu' && setModal({ type: 'deletePost', postId: modal.postId })}
        onReport={() => setModal({ type: 'report', target: '게시글' })}
      />

      <ConfirmDialog
        open={modal?.type === 'deletePost' || modal?.type === 'deleteComment'}
        title={modal?.type === 'deleteComment' ? '댓글을 삭제할까요?' : '게시글을 삭제할까요?'}
        description={
          modal?.type === 'deleteComment' ? '삭제한 댓글은 되돌릴 수 없어요.' : '삭제한 글과 댓글은 되돌릴 수 없어요.'
        }
        confirmText="삭제"
        tone="danger"
        onCancel={() => setModal(null)}
        onConfirm={() => {
          if (modal?.type === 'deletePost') confirmDeletePost(modal.postId)
          else if (modal?.type === 'deleteComment') confirmDeleteComment(modal.postId, modal.commentId)
        }}
      />

      <ReportDialog
        open={modal?.type === 'report'}
        target={modal?.type === 'report' ? modal.target : '게시글'}
        reason={reportReason}
        onReasonChange={setReportReason}
        onClose={() => setModal(null)}
        onSubmit={submitReport}
      />

      <Toast message={toast} />
    </AppLayout>
  )
}

function PostSkeletons() {
  return (
    <div className="space-y-sm" aria-label="게시글 불러오는 중">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-[124px] animate-pulse rounded-lg border border-border-subtle bg-bg-surface p-md">
          <div className="h-5 w-10 rounded-full bg-bg-canvas" />
          <div className="mt-3 h-3 w-1/3 rounded-full bg-bg-canvas" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-bg-canvas" />
        </div>
      ))}
    </div>
  )
}

function PostMenuDialog({
  open,
  isMyPost,
  onClose,
  onEdit,
  onDelete,
  onReport,
}: {
  open: boolean
  isMyPost: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}) {
  const titleId = useId()
  const itemClass = 'flex h-11 w-full items-center gap-2.5 rounded-sm px-3 text-label transition'
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} closeOnBackdrop className="w-[300px] p-md">
      <h2 id={titleId} className="sr-only">
        게시글 메뉴
      </h2>
      {isMyPost ? (
        <>
          <button type="button" onClick={onEdit} className={`${itemClass} hover:bg-bg-canvas`}>
            <Pencil className="size-4 text-icon-muted" strokeWidth={1.75} aria-hidden />
            게시글 수정
          </button>
          <button type="button" onClick={onDelete} className={`${itemClass} text-text-danger hover:bg-bg-danger-soft`}>
            <Trash2 className="size-4 text-icon-danger" strokeWidth={1.75} aria-hidden />
            게시글 삭제
          </button>
        </>
      ) : (
        <button type="button" onClick={onReport} className={`${itemClass} hover:bg-bg-canvas`}>
          <Flag className="size-4 text-icon-muted" strokeWidth={1.75} aria-hidden />
          신고하기
        </button>
      )}
    </Modal>
  )
}

function ReportDialog({
  open,
  target,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  target: '게시글' | '댓글'
  reason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="w-[360px] p-xl">
      <h2 id={titleId} className="text-heading">
        {target} 신고
      </h2>
      <p className="mt-xs text-caption text-text-secondary">신고한 사람의 정보는 공개되지 않아요.</p>
      <p className="mt-sm flex items-start gap-1.5 rounded-sm bg-bg-canvas px-3 py-2 text-caption text-text-secondary">
        <Info className="mt-0.5 size-3.5 shrink-0 text-icon-muted" strokeWidth={1.75} aria-hidden />
        신고 기능은 준비 중이에요. 지금은 화면 시연만 되고 실제로 접수되지 않아요.
      </p>
      <fieldset className="mt-md">
        <legend className="sr-only">신고 사유</legend>
        {reportReasons.map((item) => (
          <label
            key={item}
            className="flex h-11 cursor-pointer items-center justify-between border-b border-border-subtle text-label last:border-0"
          >
            {item}
            <input
              type="radio"
              name="report-reason"
              value={item}
              checked={reason === item}
              onChange={() => onReasonChange(item)}
              className="size-4 accent-bg-brand"
            />
          </label>
        ))}
      </fieldset>
      <div className="mt-lg flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button size="sm" onClick={onSubmit}>
          신고하기
        </Button>
      </div>
    </Modal>
  )
}

export default CommunityPage
