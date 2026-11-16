import { Flag, Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ActionSheet from '../../components/common/ActionSheet'
import BackButton from '../../components/common/BackButton'
import Button from '../../components/common/Button'
import CardSkeleton from '../../components/common/CardSkeleton'
import ChipGroup from '../../components/common/ChipGroup'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import SearchField from '../../components/common/SearchField'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import CommentInput from '../../components/community/CommentInput'
import CommentList from '../../components/community/CommentList'
import PostCard from '../../components/community/PostCard'
import PostDetail from '../../components/community/PostDetail'
import ReportDialog from '../../components/community/ReportDialog'
import type { Comment, Post } from '../../components/community/types'
import WriteFab from '../../components/community/WriteFab'
import WritePostModal, { type WritePostValues } from '../../components/community/WritePostModal'
import { EmptyState, InlineError } from '../../components/feedback/Feedback'
import { HomePanel, HomePanelRow } from '../../components/home/HomeCards'
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
  // 개발 확인용: 개발 서버(npm run dev)에서 /community?state=error 로 열면 '불러오기 실패' 화면을 볼 수 있어요.
  // 배포 빌드에서는 import.meta.env.DEV가 false라서 이 쿼리는 무시돼요.
  const simulateLoadError = import.meta.env.DEV && searchParams.get('state') === 'error'

  const [posts, setPosts] = useState(mockCommunityPosts)
  const [selectedBoard, setSelectedBoard] = useState<Board>('전체')
  const [sortOrder, setSortOrder] = useState<SortOrder>('최신순')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [reportReason, setReportReason] = useState('도배·광고')
  const [feedStatus, setFeedStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const feedTimerRef = useRef<number | undefined>(undefined)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // TODO: API 연동 시 본인 여부는 서버가 판단해 내려준다(isMine). 클라이언트 판단은 표시용일 뿐 권한 검사가 아니다.
  const isMine = (authorId: string) => authorId === profile.id
  const myBoard = boards.find((board) => board === profile.generation) ?? '전체'

  // TODO: 게시글 목록 API 연동 시 실제 요청으로 교체 (지금은 0.5초 뒤 목업 데이터를 보여 줘요)
  const scheduleFeedResult = useCallback(() => {
    window.clearTimeout(feedTimerRef.current)
    feedTimerRef.current = window.setTimeout(() => setFeedStatus(simulateLoadError ? 'error' : 'ready'), 500)
  }, [simulateLoadError])

  useEffect(() => {
    scheduleFeedResult()
    return () => window.clearTimeout(feedTimerRef.current)
  }, [scheduleFeedResult])

  // 다시 시도해도 주소(?state=error)는 그대로 두어, 실패가 계속되면 실패 화면이 다시 보여요.
  function retryFeed() {
    setFeedStatus('loading')
    scheduleFeedResult()
  }

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = posts.filter((post) => {
      // 전체 탭은 모든 글, 기수 탭은 그 기수 게시판 글만 보여 줘요.
      const boardMatches = selectedBoard === '전체' || post.board === selectedBoard
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

  function submitComment(content: string) {
    if (!selectedPost) return
    const newComment: CommunityComment = {
      id: createId('comment'),
      authorId: profile.id,
      authorCohort: profile.generation,
      time: '방금',
      content,
    }
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedPost.id ? { ...post, comments: [...post.comments, newComment] } : post,
      ),
    )
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

  return (
    <AppLayout activeMenu="community">
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-5 md:px-8 md:py-6">
        {selectedPost ? (
          <div className="mx-auto max-w-[760px] space-y-sm">
            <BackButton onClick={() => openPost(null)}>{selectedPost.board} 게시판</BackButton>
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
            <CommentInput onSubmit={submitComment} inputRef={commentInputRef} />
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
              <div className="flex items-center gap-2 sm:mt-xs">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="제목·내용 검색"
                  className="h-10! min-w-0 flex-1 sm:w-[260px] sm:flex-none"
                />
                {/* 모바일은 오른쪽 아래 WriteFab으로 써요 (Button의 inline-flex가 hidden을 덮어써서 감싸서 숨김) */}
                <div className="hidden sm:block">
                  <Button size="sm" className="h-8! px-3! text-caption!" onClick={() => setModal({ type: 'write' })}>
                    <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                    글쓰기
                  </Button>
                </div>
              </div>
            </header>

            <div className="mt-xs flex flex-wrap items-center justify-between gap-sm">
              <ChipGroup
                label="게시판"
                options={boards.map((board) => ({ value: board, label: board }))}
                value={selectedBoard}
                onChange={setSelectedBoard}
              />
              <Select
                variant="compact"
                label="정렬"
                placeholder="선택"
                options={SORT_OPTIONS}
                value={sortOrder}
                onChange={(value) => setSortOrder(value as SortOrder)}
              />
            </div>

            <div className="mt-md grid grid-cols-1 items-start gap-xl lg:grid-cols-[minmax(0,1fr)_278px]">
              <section className="space-y-sm" aria-label="게시글 목록">
                {feedStatus === 'loading' ? (
                  <CardSkeleton count={4} label="게시글 불러오는 중" />
                ) : feedStatus === 'error' ? (
                  <div className="rounded-lg border border-border-subtle bg-bg-surface p-lg shadow-cloud-sm">
                    <InlineError
                      title="게시글을 불러오지 못했어요"
                      description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                      onRetry={retryFeed}
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

              <aside className="space-y-sm">
                <HomePanel title="이번 주 인기글">
                  {popularPosts.map((post, index) => (
                    <HomePanelRow
                      key={post.id}
                      size="sm"
                      leading={index + 1}
                      title={post.title}
                      onClick={() => openPost(post.id)}
                    />
                  ))}
                </HomePanel>
                <HomePanel title="내 활동" divided={false}>
                  <li>
                    <dl className="flex gap-xl pb-xs">
                      {[
                        { label: '작성글', value: myPostCount },
                        { label: '댓글', value: myCommentCount },
                      ].map((stat) => (
                        <div key={stat.label} className="flex flex-col-reverse">
                          <dt className="text-caption text-text-secondary">{stat.label}</dt>
                          <dd className="text-heading font-normal tabular-nums">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                </HomePanel>
              </aside>
            </div>
          </>
        )}
      </main>

      {!selectedPost && (
        <WriteFab onClick={() => setModal({ type: 'write' })} className="fixed right-5 bottom-6 z-30 sm:hidden" />
      )}

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

      <ActionSheet
        open={modal?.type === 'postMenu'}
        title="게시글 메뉴"
        items={
          modal?.type === 'postMenu' && isMine(posts.find((post) => post.id === modal.postId)?.authorId ?? '')
            ? [
                {
                  label: '게시글 수정',
                  icon: Pencil,
                  onSelect: () => setModal({ type: 'edit', postId: modal.postId }),
                },
                {
                  label: '게시글 삭제',
                  icon: Trash2,
                  danger: true,
                  onSelect: () => setModal({ type: 'deletePost', postId: modal.postId }),
                },
              ]
            : [{ label: '신고하기', icon: Flag, onSelect: () => setModal({ type: 'report', target: '게시글' }) }]
        }
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        open={modal?.type === 'deletePost' || modal?.type === 'deleteComment'}
        title={modal?.type === 'deleteComment' ? '댓글을 삭제할까요?' : '게시글을 삭제할까요?'}
        // TODO: 삭제 API 연동 후 "삭제한 글(댓글)은 되돌릴 수 없어요."로 바꾸기
        description="목업 단계라 이 화면에서만 지워지고, 새로고침하면 다시 나타나요."
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

export default CommunityPage
