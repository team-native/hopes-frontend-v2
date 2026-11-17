import { Flag, Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getBoards,
  getComments,
  getMyComments,
  getMyPosts,
  getPost,
  getPosts,
  reportCommunityItem,
  setPostLike,
  updateComment,
  updatePost,
  type BoardDto,
  type CommunityCommentDto,
  type CommunityPostDto,
  type CommunityPostPreviewDto,
} from '../../api/community'
import ActionSheet from '../../components/common/ActionSheet'
import BackButton from '../../components/common/BackButton'
import Button from '../../components/common/Button'
import CardSkeleton from '../../components/common/CardSkeleton'
import ChipGroup from '../../components/common/ChipGroup'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import SearchField from '../../components/common/SearchField'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import TextArea from '../../components/common/TextArea'
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

const SORT_OPTIONS = ['최신순', '인기순'] as const
type SortOrder = (typeof SORT_OPTIONS)[number]
type ViewPost = Post & { boardId: number; isMine: boolean }
type ViewComment = Comment & { isMine: boolean }
type ModalState =
  | { type: 'write' }
  | { type: 'edit'; postId: string }
  | { type: 'postMenu'; postId: string }
  | { type: 'commentMenu'; commentId: string }
  | { type: 'editComment'; commentId: string }
  | { type: 'deletePost'; postId: string }
  | { type: 'deleteComment'; postId: string; commentId: string }
  | { type: 'report'; target: '게시글' | '댓글'; targetId: string }
  | null

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return days === 1 ? '어제' : `${days}일 전`
}

function mapPreview(post: CommunityPostPreviewDto, boards: BoardDto[]): ViewPost {
  return {
    id: String(post.id),
    board: boards.find((board) => board.id === post.boardId)?.name ?? '전체',
    boardId: post.boardId,
    title: post.title,
    content: post.preview,
    authorCohort: post.authorLabel,
    timeAgo: timeAgo(post.createdAt),
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    liked: post.likedByMe,
    isMine: post.isMine,
  }
}

function mapPost(post: CommunityPostDto, boards: BoardDto[]): ViewPost {
  return {
    ...mapPreview({ ...post, preview: post.content }, boards),
    content: post.content,
  }
}

function mapComment(comment: CommunityCommentDto): ViewComment {
  return {
    id: String(comment.id),
    authorCohort: comment.authorLabel,
    timeAgo: timeAgo(comment.createdAt),
    content: comment.content,
    isMine: comment.isMine,
  }
}

async function countAllPages(fetchPage: (page: number) => Promise<{ items: unknown[]; hasNext: boolean }>) {
  let page = 0
  let count = 0
  let hasNext = true
  while (hasNext) {
    const result = await fetchPage(page)
    count += result.items.length
    hasNext = result.hasNext
    page += 1
  }
  return count
}

function CommunityPage() {
  const { profile } = useProfile()
  const { toast, showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPostId = searchParams.get('post')
  const editRequested = searchParams.get('edit') === '1'
  const [boards, setBoards] = useState<BoardDto[]>([])
  const [posts, setPosts] = useState<ViewPost[]>([])
  const [comments, setComments] = useState<ViewComment[]>([])
  const [myActivityCounts, setMyActivityCounts] = useState({ posts: 0, comments: 0 })
  const [selectedPost, setSelectedPost] = useState<ViewPost | null>(null)
  const [postLoad, setPostLoad] = useState<{ id: string; status: 'loading' | 'ready' | 'error' } | null>(null)
  const [selectedBoard, setSelectedBoard] = useState('전체')
  const [sortOrder, setSortOrder] = useState<SortOrder>('최신순')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [reportReason, setReportReason] = useState('도배·광고')
  const [feedStatus, setFeedStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [commentInputError, setCommentInputError] = useState('')
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)
  const pendingLikeIds = useRef(new Set<string>())
  const [pendingLikeIdsState, setPendingLikeIdsState] = useState<Set<string>>(new Set())
  const commentInputRef = useRef<HTMLInputElement>(null)

  const boardNames = useMemo(() => ['전체', ...new Set(boards.map(({ name }) => name))], [boards])
  const myBoard = boardNames.includes(profile.generation) ? profile.generation : '전체'
  const editingPost =
    modal?.type === 'edit'
      ? ((selectedPost?.id === modal.postId ? selectedPost : undefined) ??
        posts.find((post) => post.id === modal.postId))
      : undefined
  const popularPosts = useMemo(() => [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3), [posts])
  const filteredPosts = useMemo(
    () => (sortOrder === '인기순' ? [...posts].sort((a, b) => b.likeCount - a.likeCount) : posts),
    [posts, sortOrder],
  )

  const loadFeed = useCallback(async () => {
    setFeedStatus('loading')
    try {
      const boardData = await getBoards()
      setBoards(boardData)
      const page = await getPosts({
        boardId: selectedBoard === '전체' ? undefined : boardData.find((board) => board.name === selectedBoard)?.id,
        keyword: search.trim() || undefined,
        page: 0,
        size: 50,
      })
      setPosts(page.items.map((post) => mapPreview(post, boardData)))
      setFeedStatus('ready')
    } catch {
      setFeedStatus('error')
    }
  }, [search, selectedBoard])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeed(), search ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [loadFeed, retryKey, search])

  useEffect(() => {
    let active = true
    Promise.all([
      countAllPages((page) => getMyPosts({ page, size: 50 })),
      countAllPages((page) => getMyComments({ page, size: 50 })),
    ])
      .then(([postCount, commentCount]) => {
        if (active) setMyActivityCounts({ posts: postCount, comments: commentCount })
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPostId) return
    let active = true
    Promise.all([getBoards(), getPost(selectedPostId), getComments(selectedPostId)])
      .then(([boardData, postData, commentData]) => {
        if (!active) return
        setBoards(boardData)
        setSelectedPost(mapPost(postData, boardData))
        setComments(commentData.map(mapComment))
        setPostLoad({ id: selectedPostId, status: 'ready' })
        if (editRequested && postData.isMine) setModal({ type: 'edit', postId: selectedPostId })
      })
      .catch(() => {
        if (active) setPostLoad({ id: selectedPostId, status: 'error' })
      })
    return () => {
      active = false
    }
  }, [selectedPostId, detailRetryKey, editRequested])

  const detailStatus = postLoad?.id === selectedPostId ? postLoad.status : 'loading'
  const visiblePost = selectedPost?.id === selectedPostId ? selectedPost : null

  const myPostCount = myActivityCounts.posts
  const myCommentCount = myActivityCounts.comments
  const openPost = (postId: string | null) => setSearchParams(postId ? { post: postId } : {})

  async function submitPost(values: WritePostValues) {
    try {
      if (modal?.type === 'edit') {
        await updatePost(modal.postId, { title: values.title, content: values.content })
        setSearchParams({ post: modal.postId })
        showToast('게시글을 수정했어요')
        await loadFeed()
      } else {
        const board = boards.find(({ name }) => name === values.board)
        if (!board) throw new Error('BOARD_NOT_FOUND')
        const post = await createPost({ boardId: board.id, title: values.title, content: values.content })
        showToast('게시글을 등록했어요')
        await loadFeed()
        openPost(String(post.id))
      }
    } catch {
      throw new Error('COMMUNITY_REQUEST_FAILED')
    }
  }

  async function toggleLike(post: ViewPost) {
    if (pendingLikeIds.current.has(post.id)) return
    pendingLikeIds.current.add(post.id)
    setPendingLikeIdsState(new Set(pendingLikeIds.current))
    try {
      await setPostLike(post.id, !post.liked)
      const updated = await getPost(post.id)
      const mapped = mapPost(updated, boards)
      setSelectedPost(mapped)
      setPosts((current) => current.map((item) => (item.id === mapped.id ? mapped : item)))
    } catch {
      showToast('좋아요를 반영하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      pendingLikeIds.current.delete(post.id)
      setPendingLikeIdsState(new Set(pendingLikeIds.current))
    }
  }

  async function submitComment(content: string) {
    if (!selectedPost) return
    setCommentInputError('')
    try {
      await createComment(selectedPost.id, content)
      const [post, nextComments] = await Promise.all([getPost(selectedPost.id), getComments(selectedPost.id)])
      setSelectedPost(mapPost(post, boards))
      setComments(nextComments.map(mapComment))
    } catch {
      setCommentInputError('댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function submitCommentEdit() {
    if (modal?.type !== 'editComment' || !selectedPost || !editingCommentContent.trim()) return
    try {
      await updateComment(modal.commentId, editingCommentContent.trim())
      const [post, nextComments] = await Promise.all([getPost(selectedPost.id), getComments(selectedPost.id)])
      setSelectedPost(mapPost(post, boards))
      setComments(nextComments.map(mapComment))
      setModal(null)
      showToast('댓글을 수정했어요')
    } catch {
      showToast('댓글을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function confirmDeletePost(postId: string) {
    try {
      await deletePost(postId)
      setModal(null)
      openPost(null)
      showToast('게시글을 삭제했어요')
      await loadFeed()
    } catch {
      showToast('게시글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function confirmDeleteComment(commentId: string) {
    if (!selectedPost) return
    try {
      await deleteComment(commentId)
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      setSelectedPost((current) =>
        current ? { ...current, commentCount: Math.max(0, current.commentCount - 1) } : current,
      )
      setModal(null)
    } catch {
      showToast('댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function submitReport() {
    if (modal?.type !== 'report') return
    try {
      await reportCommunityItem(modal.target === '게시글' ? 'POST' : 'COMMENT', modal.targetId, reportReason)
      setModal(null)
      showToast('신고를 접수했어요')
    } catch {
      showToast('신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  function handleCommentMore(comment: ViewComment) {
    if (!selectedPost) return
    setModal({ type: 'commentMenu', commentId: comment.id })
  }

  const actionSheetItems = (() => {
    if (modal?.type === 'commentMenu') {
      const commentId = modal.commentId
      const comment = comments.find((item) => item.id === commentId)
      if (!comment?.isMine) {
        return [
          {
            label: '신고하기',
            icon: Flag,
            onSelect: () => setModal({ type: 'report', target: '댓글', targetId: commentId }),
          },
        ]
      }
      return [
        {
          label: '댓글 수정',
          icon: Pencil,
          onSelect: () => {
            setEditingCommentContent(comment.content)
            setModal({ type: 'editComment', commentId })
          },
        },
        {
          label: '댓글 삭제',
          icon: Trash2,
          danger: true,
          onSelect: () => selectedPost && setModal({ type: 'deleteComment', postId: selectedPost.id, commentId }),
        },
      ]
    }
    if (modal?.type === 'postMenu') {
      const postId = modal.postId
      const post = (selectedPost?.id === postId ? selectedPost : undefined) ?? posts.find((item) => item.id === postId)
      if (post?.isMine) {
        return [
          { label: '게시글 수정', icon: Pencil, onSelect: () => setModal({ type: 'edit', postId }) },
          {
            label: '게시글 삭제',
            icon: Trash2,
            danger: true,
            onSelect: () => setModal({ type: 'deletePost', postId }),
          },
        ]
      }
      return [
        {
          label: '신고하기',
          icon: Flag,
          onSelect: () => setModal({ type: 'report', target: '게시글', targetId: postId }),
        },
      ]
    }
    return []
  })()

  return (
    <AppLayout activeMenu="community">
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-5 md:px-8 md:py-6">
        {selectedPostId ? (
          detailStatus === 'ready' && visiblePost ? (
            <div className="mx-auto max-w-[760px] space-y-sm">
              <BackButton onClick={() => openPost(null)}>{visiblePost.board} 게시판</BackButton>
              <PostDetail
                post={visiblePost}
                likeDisabled={pendingLikeIdsState.has(visiblePost.id)}
                onToggleLike={() => void toggleLike(visiblePost)}
                onCommentClick={() => commentInputRef.current?.focus()}
                onMoreClick={() => setModal({ type: 'postMenu', postId: visiblePost.id })}
              />
              <SectionHeader title={`댓글 ${visiblePost.commentCount}`} className="pt-xs" />
              {comments.length > 0 ? (
                <CommentList comments={comments} onMoreClick={(comment) => handleCommentMore(comment as ViewComment)} />
              ) : (
                <p className="py-sm text-caption text-text-secondary">첫 댓글을 남겨 보세요.</p>
              )}
              {commentInputError && (
                <p role="alert" className="text-caption text-text-danger">
                  {commentInputError}
                </p>
              )}
              <CommentInput onSubmit={(content) => void submitComment(content)} inputRef={commentInputRef} />
            </div>
          ) : detailStatus === 'error' ? (
            <div className="mx-auto max-w-[760px] rounded-lg border border-border-subtle bg-bg-surface p-lg shadow-cloud-sm">
              <InlineError
                title="게시글을 불러오지 못했어요"
                description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                onRetry={() => {
                  if (selectedPostId) setPostLoad({ id: selectedPostId, status: 'loading' })
                  setDetailRetryKey((key) => key + 1)
                }}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-[760px] py-3xl">
              <CardSkeleton count={1} label="게시글 불러오는 중" />
            </div>
          )
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
                options={boardNames.map((board) => ({ value: board, label: board }))}
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
                      onRetry={() => setRetryKey((key) => key + 1)}
                    />
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => <PostCard key={post.id} post={post} onClick={() => openPost(post.id)} />)
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

      {!selectedPostId && (
        <WriteFab onClick={() => setModal({ type: 'write' })} className="fixed right-5 bottom-6 z-30 sm:hidden" />
      )}

      <WritePostModal
        open={modal?.type === 'write' || modal?.type === 'edit'}
        onClose={() => setModal(null)}
        boards={
          modal?.type === 'edit' ? [editingPost?.board ?? myBoard] : boardNames.filter((board) => board !== '전체')
        }
        defaultBoard={myBoard}
        mode={modal?.type === 'edit' ? 'edit' : 'create'}
        initialValues={editingPost}
        authorNotice={`작성자는 내 기수(${profile.generation})로만 표시돼요. 이름·학번은 공개되지 않아요.`}
        onSubmit={submitPost}
      />

      <ActionSheet
        open={modal?.type === 'postMenu' || modal?.type === 'commentMenu'}
        title={modal?.type === 'commentMenu' ? '댓글 메뉴' : '게시글 메뉴'}
        items={actionSheetItems}
        onClose={() => setModal(null)}
      />

      <Modal open={modal?.type === 'editComment'} onClose={() => setModal(null)} className="w-[520px] p-lg">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submitCommentEdit()
          }}
        >
          <h2 className="text-heading">댓글 수정</h2>
          <TextArea
            className="mt-md"
            label="댓글 내용"
            value={editingCommentContent}
            onChange={(event) => setEditingCommentContent(event.target.value)}
            rows={4}
          />
          <div className="mt-md flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              취소
            </Button>
            <Button type="submit" disabled={!editingCommentContent.trim()}>
              저장
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={modal?.type === 'deletePost' || modal?.type === 'deleteComment'}
        title={modal?.type === 'deleteComment' ? '댓글을 삭제할까요?' : '게시글을 삭제할까요?'}
        description="삭제한 내용은 되돌릴 수 없어요."
        confirmText="삭제"
        tone="danger"
        onCancel={() => setModal(null)}
        onConfirm={() => {
          if (modal?.type === 'deletePost') void confirmDeletePost(modal.postId)
          if (modal?.type === 'deleteComment') void confirmDeleteComment(modal.commentId)
        }}
      />

      <ReportDialog
        open={modal?.type === 'report'}
        target={modal?.type === 'report' ? modal.target : '게시글'}
        reason={reportReason}
        onReasonChange={setReportReason}
        onClose={() => setModal(null)}
        onSubmit={() => void submitReport()}
        notice={null}
      />

      <Toast message={toast} />
    </AppLayout>
  )
}

export default CommunityPage
