import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Icon from '../../components/common/Icon'
import useAppNavigation from '../../hooks/useAppNavigation'
import useProfile from '../../hooks/useProfile'
import { boards, mockCommunityPosts, type Board, type CommunityComment, type CommunityPost } from '../../mocks/community'

type Modal = 'write' | 'delete' | 'report' | null

const reportReasons = ['욕설·비방', '도배·광고', '개인정보 노출', '부적절한 내용', '기타']

function authorLabel(authorCohort: string, isMine: boolean) {
  return isMine ? `${authorCohort} (나)` : authorCohort
}

function CommunityPage() {
  const navigate = useNavigate()
  const { goToSection } = useAppNavigation()
  const { profile } = useProfile()
  const location = useLocation()
  const [posts, setPosts] = useState(mockCommunityPosts)
  const [selectedBoard, setSelectedBoard] = useState<Board>('전체')
  const [sortOrder, setSortOrder] = useState<'최신순' | '인기순'>('최신순')
  const [search, setSearch] = useState('')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState(reportReasons[1])
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeBoard, setWriteBoard] = useState<Board>('전체')
  const [writeErrors, setWriteErrors] = useState({ title: false, content: false })
  const [commentDraft, setCommentDraft] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const showErrorPreview = new URLSearchParams(location.search).get('state') === 'error'
  // TODO: API 연동 시 본인 여부는 서버가 판단해 내려준다(isMine). 클라이언트 판단은 표시용일 뿐 권한 검사가 아니다.
  const isMine = (authorId: string) => authorId === profile.id

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

  const selectedPost = posts.find((post) => post.id === selectedPostId)
  const myPostCount = posts.filter((post) => post.authorId === profile.id).length
  const myCommentCount = posts.reduce((count, post) => count + post.comments.filter((comment) => comment.authorId === profile.id).length, 0)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function openWriteModal() {
    setEditingPostId(null)
    setWriteTitle('')
    setWriteContent('')
    setWriteBoard(boards.find((board) => board === profile.generation) ?? '전체')
    setWriteErrors({ title: false, content: false })
    setModal('write')
  }

  function openEditModal(post: CommunityPost) {
    if (!isMine(post.authorId)) return
    setEditingPostId(post.id)
    setWriteTitle(post.title)
    setWriteContent(post.content)
    setWriteBoard(post.board)
    setWriteErrors({ title: false, content: false })
    setModal('write')
  }

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = { title: !writeTitle.trim(), content: !writeContent.trim() }
    setWriteErrors(errors)
    if (errors.title || errors.content) return

    if (editingPostId) {
      // 게시판·제목·내용만 수정한다. 작성자 기수는 작성 시점 값을 유지한다.
      setPosts((current) => current.map((post) => (
        post.id === editingPostId && isMine(post.authorId)
          ? { ...post, board: writeBoard, title: writeTitle.trim(), content: writeContent.trim() }
          : post
      )))
      setModal(null)
      setEditingPostId(null)
      showToast('게시글을 수정했어요')
      return
    }

    const newPost: CommunityPost = {
      id: crypto.randomUUID(),
      board: writeBoard,
      authorId: profile.id,
      // 작성자 기수는 사용자가 고르지 않고 로그인 정보로 정한다. (API 연동 시 서버가 결정)
      authorCohort: profile.generation,
      time: '방금',
      title: writeTitle.trim(),
      content: writeContent.trim(),
      likes: 0,
      likedByMe: false,
      comments: [],
    }
    setPosts((current) => [newPost, ...current])
    setSelectedBoard('전체')
    setSearch('')
    setModal(null)
    showToast('게시글을 등록했어요')
  }

  function toggleLike(postId: string) {
    setPosts((current) => current.map((post) => (
      post.id === postId
        ? { ...post, likedByMe: !post.likedByMe, likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)) }
        : post
    )))
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPost || !commentDraft.trim()) return
    const newComment: CommunityComment = {
      id: crypto.randomUUID(),
      authorId: profile.id,
      authorCohort: profile.generation,
      time: '방금',
      content: commentDraft.trim(),
    }
    setPosts((current) => current.map((post) => post.id === selectedPost.id ? { ...post, comments: [...post.comments, newComment] } : post))
    setCommentDraft('')
  }

  function confirmDelete() {
    const target = posts.find((post) => post.id === postToDelete)
    if (target && isMine(target.authorId)) {
      setPosts((current) => current.filter((post) => post.id !== target.id))
      if (selectedPostId === target.id) setSelectedPostId(null)
      showToast('게시글을 삭제했어요')
    }
    setPostToDelete(null)
    setModal(null)
  }

  function submitReport() {
    // TODO: 신고 API 연동 후 실제 접수 및 성공/실패 처리
    setModal(null)
    showToast('신고 기능은 준비 중이라 접수되지 않았어요')
  }

  function retryFeed() {
    navigate('/community', { replace: true })
    setLoading(true)
    window.setTimeout(() => setLoading(false), 500)
  }

  return (
    <AppLayout
      activeSection="community"
      onSectionChange={(section) => {
        if (section === 'community') setSelectedPostId(null)
        else goToSection(section)
      }}
    >
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-5 md:px-8 md:py-6">
        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            isMine={isMine}
            onBack={() => setSelectedPostId(null)}
            onLike={() => toggleLike(selectedPost.id)}
            onComment={submitComment}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            onEdit={() => openEditModal(selectedPost)}
            onDelete={() => { setPostToDelete(selectedPost.id); setModal('delete') }}
            onReport={() => setModal('report')}
          />
        ) : (
          <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">커뮤니티</h1>
                <p className="mt-1 text-xs text-sub">기수와 상관없이 모든 게시판을 읽고 쓸 수 있어요. 작성자는 기수만 표시돼요.</p>
              </div>
              <div className="flex gap-2">
                <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-white px-3 text-sub sm:w-60 sm:flex-none">
                  <Icon name="search" className="size-4 shrink-0" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목·내용 검색" className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-[#9aa4ba]" />
                </label>
                <button onClick={openWriteModal} className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-white transition hover:bg-primary-hover">
                  <Icon name="pencil" className="size-6" /> 글쓰기
                </button>
              </div>
            </header>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" aria-label="기수 필터">
                {boards.map((board) => (
                  <button key={board} onClick={() => setSelectedBoard(board)} aria-pressed={selectedBoard === board} className={`h-8 rounded-full border px-3 text-xs transition ${selectedBoard === board ? 'border-[#cbd9ff] bg-[#edf3ff] font-medium text-brand' : 'border-line bg-white text-sub hover:border-[#cbd9ff]'}`}>
                    {board}
                  </button>
                ))}
              </div>
              <label className="flex h-8 items-center rounded-full border border-line bg-white px-3 text-xs text-sub">
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as '최신순' | '인기순')} aria-label="정렬 순서" className="cursor-pointer bg-transparent outline-none">
                  <option>최신순</option><option>인기순</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <section className="space-y-3" aria-label="게시글 목록">
                {loading ? (
                  <PostSkeletons />
                ) : showErrorPreview ? (
                  <EmptyState icon="alert" title="게시글을 불러오지 못했어요" description="네트워크 상태를 확인한 뒤 다시 시도해 주세요." action="다시 시도" onAction={retryFeed} tone="error" />
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isMine={isMine(post.authorId)}
                      onOpen={() => setSelectedPostId(post.id)}
                      onLike={() => toggleLike(post.id)}
                    />
                  ))
                ) : search.trim() ? (
                  <EmptyState icon="search" title="검색 결과가 없어요" description="다른 단어로 검색하거나 게시판을 바꿔 보세요." />
                ) : (
                  <EmptyState icon="chat" title="아직 게시글이 없어요" description={`${selectedBoard} 게시판의 첫 글을 남겨보세요.`} action="글쓰기" onAction={openWriteModal} />
                )}
              </section>

              <aside className="space-y-3">
                <section className="rounded-[20px] border border-[#edf1f8] bg-white p-4 shadow-[0_4px_14px_rgba(37,56,95,0.05)]">
                  <h2 className="mb-2 text-xs font-medium text-sub">이번 주 인기글</h2>
                  {['현장실습 면접 준비 팁', '전공 동아리 면접 후기 공유', '취업 준비 언제부터 시작했어?'].map((title, index) => (
                    <button key={title} onClick={() => { const post = posts.find((item) => item.title === title); if (post) setSelectedPostId(post.id) }} className="flex min-h-10 w-full items-center gap-2 border-b border-[#edf0f5] text-left last:border-0">
                      <span className="text-xs font-medium text-brand">{index + 1}</span><span className="truncate text-xs font-medium text-ink">{title}</span>
                    </button>
                  ))}
                </section>
                <section className="rounded-[20px] border border-[#edf1f8] bg-white p-4 shadow-[0_4px_14px_rgba(37,56,95,0.05)]">
                  <h2 className="mb-3 text-xs font-medium text-sub">내 활동</h2>
                  <div className="flex gap-6">
                    <div><strong className="block text-lg font-semibold">{myPostCount}</strong><span className="text-xs text-sub">작성글</span></div>
                    <div><strong className="block text-lg font-semibold">{myCommentCount}</strong><span className="text-xs text-sub">댓글</span></div>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>

      {modal === 'write' && (
        <Modal onClose={() => setModal(null)}>
          <form onSubmit={submitPost} className="w-full max-w-[520px] rounded-[20px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{editingPostId ? '게시글 수정' : '글쓰기'}</h2><button type="button" aria-label="닫기" onClick={() => setModal(null)} className="text-[#9aa4ba] hover:text-ink"><Icon name="x" className="size-5" /></button></div>
            <label className="mb-3 flex h-11 items-center justify-between rounded-xl border border-line px-3 text-xs text-sub">게시판<select value={writeBoard} onChange={(event) => setWriteBoard(event.target.value as Board)} className="bg-transparent text-sm text-ink outline-none">{boards.map((board) => <option key={board} value={board}>{board === '전체' ? '전체 게시판' : `${board} 게시판`}</option>)}</select></label>
            <input value={writeTitle} onChange={(event) => { setWriteTitle(event.target.value); setWriteErrors((current) => ({ ...current, title: false })) }} placeholder="제목" aria-label="제목" className={`mb-1 h-11 w-full rounded-xl border px-3 text-sm outline-none placeholder:text-[#9aa4ba] focus:border-focus ${writeErrors.title ? 'border-error' : 'border-line'}`} />
            {writeErrors.title && <p className="mb-2 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />제목을 입력해 주세요.</p>}
            <textarea value={writeContent} onChange={(event) => { setWriteContent(event.target.value); setWriteErrors((current) => ({ ...current, content: false })) }} placeholder="내용을 입력하세요" aria-label="내용" className={`h-48 w-full resize-none rounded-xl border p-3 text-sm outline-none placeholder:text-[#9aa4ba] focus:border-focus ${writeErrors.content ? 'border-error' : 'border-line'}`} />
            {writeErrors.content && <p className="mt-1 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />내용을 입력해 주세요.</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-sub"><Icon name="lock" className="size-4 shrink-0 text-brand" />작성자는 내 기수({profile.generation})로만 표시돼요. 이름·학번은 공개되지 않아요.</p>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="h-9 rounded-lg border border-line px-4 text-xs text-brand">취소</button><button type="submit" className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover">{editingPostId ? '수정' : '등록'}</button></div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal onClose={() => setModal(null)}>
          <div className="w-full max-w-[300px] rounded-[20px] bg-white p-5 text-center shadow-2xl">
            <h2 className="text-sm font-semibold">게시글을 삭제할까요?</h2>
            <p className="mt-2 text-xs text-sub">삭제한 글과 댓글은 되돌릴 수 없어요.</p>
            <div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setModal(null)} className="h-10 rounded-lg border border-line text-xs">취소</button><button onClick={confirmDelete} className="h-10 rounded-lg bg-[#fbf0f1] text-xs font-medium text-error">삭제</button></div>
          </div>
        </Modal>
      )}

      {modal === 'report' && (
        <Modal onClose={() => setModal(null)}>
          <div className="w-full max-w-[360px] rounded-[20px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">신고 사유 선택</h2><button aria-label="닫기" onClick={() => setModal(null)} className="text-[#9aa4ba]"><Icon name="x" className="size-5" /></button></div>
            <p className="mt-2 text-xs text-sub">신고한 사람의 정보는 공개되지 않아요.</p>
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#f7f9fc] px-3 py-2 text-xs text-sub"><Icon name="info" className="size-3.5 shrink-0" />신고 기능은 준비 중이에요. 지금은 화면 시연만 되고 실제로 접수되지 않아요.</p>
            <div className="mt-4">
              {reportReasons.map((reason) => (
                <button key={reason} onClick={() => setReportReason(reason)} className="flex h-11 w-full items-center justify-between border-b border-[#edf0f5] text-left text-xs last:border-0">
                  {reason}<span className={`flex size-5 items-center justify-center rounded-full border ${reportReason === reason ? 'border-primary bg-primary text-white' : 'border-line text-transparent'}`}>{reportReason === reason ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setModal(null)} className="h-9 rounded-lg border border-line px-4 text-xs text-brand">취소</button><button onClick={submitReport} className="h-9 rounded-lg bg-primary px-4 text-xs text-white">신고하기</button></div>
          </div>
        </Modal>
      )}

      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#202432] px-4 py-2.5 text-xs text-white shadow-lg">{toast}</div>}
    </AppLayout>
  )
}

function PostSkeletons() {
  return <div className="space-y-3" aria-label="게시글 불러오는 중">{[0, 1, 2, 3].map((item) => <div key={item} className="h-[104px] animate-pulse rounded-[20px] border border-[#edf1f8] bg-white p-4"><div className="h-4 w-10 rounded-full bg-[#edf1f5]" /><div className="mt-3 h-3 w-1/3 rounded-full bg-[#edf1f5]" /><div className="mt-2 h-3 w-1/2 rounded-full bg-[#edf1f5]" /></div>)}</div>
}

function EmptyState({ icon, title, description, action, onAction, tone = 'default' }: { icon: 'alert' | 'chat' | 'search'; title: string; description: string; action?: string; onAction?: () => void; tone?: 'default' | 'error' }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <span className={`mb-3 flex size-16 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(37,56,95,0.08)] ${tone === 'error' ? 'text-error' : 'text-primary'}`}><Icon name={icon} className="size-7" /></span>
      <h2 className="text-base font-semibold">{title}</h2><p className="mt-2 text-xs text-sub">{description}</p>
      {action && onAction && <button onClick={onAction} className="mt-4 h-9 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover">{action}</button>}
    </div>
  )
}

function PostCard({ post, isMine, onOpen, onLike }: { post: CommunityPost; isMine: boolean; onOpen: () => void; onLike: () => void }) {
  return (
    <article className="rounded-[20px] border border-[#edf1f8] bg-white p-4 shadow-[0_4px_14px_rgba(37,56,95,0.05)] transition hover:shadow-[0_7px_18px_rgba(37,56,95,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[#9aa4ba]"><div className="flex min-w-0 items-center gap-2"><span className="rounded-full bg-[#edf3ff] px-2 py-1 font-medium text-brand">{post.board}</span><span className="truncate">{authorLabel(post.authorCohort, isMine)} · {post.time}</span></div><div className="flex shrink-0 items-center gap-3"><span className={`inline-flex items-center gap-1 ${post.likedByMe ? 'text-brand' : ''}`}><Icon name="heart" className={`size-3.5 ${post.likedByMe ? 'fill-current' : ''}`} />{post.likes}</span><span className="inline-flex items-center gap-1"><Icon name="chat" className="size-3.5" />{post.comments.length}</span></div></div>
      <button onClick={onOpen} className="block w-full text-left"><h2 className="text-sm font-semibold text-ink">{post.title}</h2><p className="mt-2 line-clamp-1 text-xs leading-5 text-sub">{post.content}</p></button>
      <button onClick={onLike} aria-pressed={post.likedByMe} aria-label="좋아요" className="sr-only">좋아요</button>
    </article>
  )
}

type PostDetailProps = {
  post: CommunityPost
  isMine: (authorId: string) => boolean
  onBack: () => void
  onLike: () => void
  onComment: (event: FormEvent<HTMLFormElement>) => void
  commentDraft: string
  onCommentDraftChange: (value: string) => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}

function PostDetail({ post, isMine, onBack, onLike, onComment, commentDraft, onCommentDraftChange, onEdit, onDelete, onReport }: PostDetailProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isMyPost = isMine(post.authorId)
  return (
    <div className="mx-auto max-w-[760px]">
      <header className="mb-5 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-xs text-sub hover:text-ink"><Icon name="chevron-left" className="size-4" />{post.board} 게시판</button><button aria-label="게시글 메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 text-sub hover:bg-white"><Icon name="more" className="size-5" /></button></header>
      {menuOpen && (
        <div className="relative">
          <div className="absolute right-0 top-[-18px] z-10 w-32 rounded-xl border border-line bg-white p-1 shadow-lg">
            {isMyPost ? (
              <>
                <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[#f6f8fb]"><Icon name="pencil" className="size-4" />게시글 수정</button>
                <button onClick={() => { setMenuOpen(false); onDelete() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-error hover:bg-[#fbf0f1]"><Icon name="trash" className="size-4" />게시글 삭제</button>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); onReport() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[#f6f8fb]"><Icon name="flag" className="size-4" />신고하기</button>
            )}
          </div>
        </div>
      )}
      <article className="rounded-[20px] border border-[#edf1f8] bg-white p-5 shadow-[0_4px_14px_rgba(37,56,95,0.05)]">
        <div className="flex items-center gap-2 text-xs text-sub"><span className="rounded-full bg-[#edf3ff] px-2 py-1 font-medium text-brand">{post.board}</span><span>{authorLabel(post.authorCohort, isMyPost)} · {post.time}</span></div>
        <h1 className="mt-3 text-xl font-bold">{post.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink">{post.content}</p>
        <div className="mt-5 flex gap-2"><button onClick={onLike} aria-pressed={post.likedByMe} aria-label={post.likedByMe ? '좋아요 취소' : '좋아요'} className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition ${post.likedByMe ? 'bg-primary text-white' : 'bg-[#edf3ff] text-brand'}`}><Icon name="heart" className={`size-4 ${post.likedByMe ? 'fill-current' : ''}`} />{post.likes}</button><span className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-sub"><Icon name="chat" className="size-4" />{post.comments.length}</span></div>
      </article>
      <section className="mt-3 rounded-[20px] border border-[#edf1f8] bg-white p-5 shadow-[0_4px_14px_rgba(37,56,95,0.05)]"><h2 className="mb-4 text-sm font-semibold">댓글 {post.comments.length}</h2>
        <div className="space-y-4">{post.comments.map((comment) => <article key={comment.id} className="flex justify-between gap-3"><div><p className="text-xs text-sub"><strong className="mr-2 font-semibold text-ink">{authorLabel(comment.authorCohort, isMine(comment.authorId))}</strong>· {comment.time}</p><p className="mt-1 text-xs leading-5 text-ink">{comment.content}</p></div><button aria-label="댓글 메뉴" className="self-start text-sub">···</button></article>)}</div>
        <form onSubmit={onComment} className="mt-5 flex gap-2"><input value={commentDraft} onChange={(event) => onCommentDraftChange(event.target.value)} placeholder="댓글 달기" aria-label="댓글 달기" className="h-10 min-w-0 flex-1 rounded-full border border-line px-4 text-xs outline-none focus:border-focus" /><button disabled={!commentDraft.trim()} className="h-10 rounded-lg bg-primary px-4 text-xs text-white disabled:bg-[#b9cef7]">등록</button></form>
      </section>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#171b2a]/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>{children}</div>
}

export default CommunityPage
