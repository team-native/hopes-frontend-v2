import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Icon from '../../components/common/Icon'

type Cohort = '8기' | '9기' | '10기' | '11기'
type Board = '전체' | Cohort

type CommunityComment = {
  id: string
  cohort: Cohort
  author: string
  time: string
  content: string
}

type CommunityPost = {
  id: string
  cohort: Board
  author: string
  time: string
  title: string
  content: string
  likes: number
  comments: CommunityComment[]
}

type Modal = 'write' | 'delete' | 'report' | null

const cohorts: Cohort[] = ['8기', '9기', '10기', '11기']

const initialPosts: CommunityPost[] = [
  {
    id: 'wifi',
    cohort: '10기',
    author: '10기',
    time: '10분 전',
    title: '기숙사 와이파이 다들 잘 돼?',
    content: '3층 끝방인데 저녁만 되면 너무 느려져서 과제 제출이 힘들어. 다른 층은 어떤지, 해결 방법 아는 사람 있으면 알려줘!',
    likes: 12,
    comments: [
      { id: 'wifi-c1', cohort: '10기', author: '10기', time: '5분 전', content: '2층도 저녁엔 느려. 공유기 위치 문제 같아.' },
      { id: 'wifi-c2', cohort: '9기', author: '9기', time: '3분 전', content: '사감 선생님께 말씀드리면 점검해 주신대!' },
      { id: 'wifi-c3', cohort: '10기', author: '10기 (나)', time: '방금', content: '오 고마워, 내일 말씀드려 볼게.' },
    ],
  },
  {
    id: 'club-interview',
    cohort: '전체',
    author: '10기',
    time: '1시간 전',
    title: '전공 동아리 면접 후기 공유',
    content: '어제 보고 왔는데 생각보다 분위기 편했어. 질문은 주로 지원 동기 위주였음.',
    likes: 34,
    comments: [
      { id: 'club-c1', cohort: '9기', author: '9기', time: '40분 전', content: '어떤 질문 받았는지 알려줄 수 있어?' },
      { id: 'club-c2', cohort: '10기', author: '10기', time: '20분 전', content: '관심 분야랑 만들어 보고 싶은 걸 물어봤어.' },
    ],
  },
  {
    id: 'job-prep',
    cohort: '9기',
    author: '9기',
    time: '3시간 전',
    title: '취업 준비 언제부터 시작했어?',
    content: '2학년 여름방학부터 포트폴리오 만들기 시작했는데 늦은 건지 모르겠어.',
    likes: 21,
    comments: [
      { id: 'job-c1', cohort: '9기', author: '9기', time: '1시간 전', content: '지금부터 시작해도 충분해. 작은 프로젝트부터 완성해 봐!' },
      { id: 'job-c2', cohort: '10기', author: '10기', time: '2시간 전', content: '관심 분야 정리부터 해두면 도움이 돼.' },
    ],
  },
  {
    id: 'laundry',
    cohort: '10기',
    author: '10기',
    time: '어제',
    title: '기숙사 세탁실 이용 시간 아는 사람?',
    content: '주말에도 밤 10시까지 쓸 수 있는지 궁금해.',
    likes: 4,
    comments: [
      { id: 'laundry-c1', cohort: '8기', author: '8기', time: '어제', content: '층마다 운영 시간이 다를 수 있어서 공지 확인해 봐!' },
      { id: 'laundry-c2', cohort: '10기', author: '10기', time: '어제', content: '우리 층은 10시까지였어.' },
    ],
  },
]

const reportReasons = ['욕설·비방', '도배·광고', '개인정보 노출', '부적절한 내용', '기타']

function CommunityPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState(initialPosts)
  const [selectedCohort, setSelectedCohort] = useState<'전체' | Cohort>('전체')
  const [sortOrder, setSortOrder] = useState<'최신순' | '인기순'>('최신순')
  const [search, setSearch] = useState('')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState(reportReasons[1])
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeCohort, setWriteCohort] = useState<Cohort>('10기')
  const [writeErrors, setWriteErrors] = useState({ title: false, content: false })
  const [commentDraft, setCommentDraft] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const showErrorPreview = new URLSearchParams(location.search).get('state') === 'error'

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = posts.filter((post) => {
      const cohortMatches = selectedCohort === '전체' || post.cohort === selectedCohort || post.cohort === '전체'
      const searchMatches = !query || `${post.title} ${post.content}`.toLowerCase().includes(query)
      return cohortMatches && searchMatches
    })
    return sortOrder === '인기순' ? [...matching].sort((a, b) => b.likes - a.likes) : matching
  }, [posts, search, selectedCohort, sortOrder])

  const selectedPost = posts.find((post) => post.id === selectedPostId)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function openWriteModal() {
    setWriteTitle('')
    setWriteContent('')
    setWriteErrors({ title: false, content: false })
    setModal('write')
  }

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = { title: !writeTitle.trim(), content: !writeContent.trim() }
    setWriteErrors(errors)
    if (errors.title || errors.content) return

    const newPost: CommunityPost = {
      id: crypto.randomUUID(),
      cohort: writeCohort,
      author: `${writeCohort} (나)`,
      time: '방금',
      title: writeTitle.trim(),
      content: writeContent.trim(),
      likes: 0,
      comments: [],
    }
    setPosts((current) => [newPost, ...current])
    setSelectedCohort('전체')
    setSearch('')
    setModal(null)
    showToast('게시글을 등록했어요')
  }

  function toggleLike(postId: string) {
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, likes: post.likes + (post.author === '10기 (나)' ? -1 : 1) } : post))
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPost || !commentDraft.trim()) return
    const newComment: CommunityComment = {
      id: crypto.randomUUID(),
      cohort: '10기',
      author: '10기 (나)',
      time: '방금',
      content: commentDraft.trim(),
    }
    setPosts((current) => current.map((post) => post.id === selectedPost.id ? { ...post, comments: [...post.comments, newComment] } : post))
    setCommentDraft('')
  }

  function confirmDelete() {
    if (postToDelete) {
      setPosts((current) => current.filter((post) => post.id !== postToDelete))
      if (selectedPostId === postToDelete) setSelectedPostId(null)
      showToast('게시글을 삭제했어요')
    }
    setPostToDelete(null)
    setModal(null)
  }

  function retryFeed() {
    navigate('/community', { replace: true })
    setLoading(true)
    window.setTimeout(() => setLoading(false), 500)
  }

  return (
    <AppLayout
      activeSection="community"
      onNewChat={() => navigate('/')}
      onRecentChat={() => navigate('/')}
      onSectionChange={(section) => {
        if (section === 'home') navigate('/')
        if (section === 'community') setSelectedPostId(null)
      }}
    >
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-5 md:px-8 md:py-6">
        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={() => setSelectedPostId(null)}
            onLike={() => toggleLike(selectedPost.id)}
            onComment={submitComment}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
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
                {(['전체', ...cohorts] as const).map((cohort) => (
                  <button key={cohort} onClick={() => setSelectedCohort(cohort)} aria-pressed={selectedCohort === cohort} className={`h-8 rounded-full border px-3 text-xs transition ${selectedCohort === cohort ? 'border-[#cbd9ff] bg-[#edf3ff] font-medium text-brand' : 'border-line bg-white text-sub hover:border-[#cbd9ff]'}`}>
                    {cohort}
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
                      onOpen={() => setSelectedPostId(post.id)}
                      onLike={() => toggleLike(post.id)}
                    />
                  ))
                ) : search.trim() ? (
                  <EmptyState icon="search" title="검색 결과가 없어요" description="다른 단어로 검색하거나 게시판을 바꿔 보세요." />
                ) : (
                  <EmptyState icon="chat" title="아직 게시글이 없어요" description={`${selectedCohort} 게시판의 첫 글을 남겨보세요.`} action="글쓰기" onAction={openWriteModal} />
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
                    <div><strong className="block text-lg font-semibold">2</strong><span className="text-xs text-sub">작성글</span></div>
                    <div><strong className="block text-lg font-semibold">5</strong><span className="text-xs text-sub">댓글</span></div>
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
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">글쓰기</h2><button type="button" aria-label="닫기" onClick={() => setModal(null)} className="text-[#9aa4ba] hover:text-ink"><Icon name="x" className="size-5" /></button></div>
            <label className="mb-3 flex h-11 items-center justify-between rounded-xl border border-line px-3 text-xs text-sub">게시판<select value={writeCohort} onChange={(event) => setWriteCohort(event.target.value as Cohort)} className="bg-transparent text-sm text-ink outline-none">{cohorts.map((cohort) => <option key={cohort}>{cohort}</option>)}</select></label>
            <input value={writeTitle} onChange={(event) => { setWriteTitle(event.target.value); setWriteErrors((current) => ({ ...current, title: false })) }} placeholder="제목" aria-label="제목" className={`mb-1 h-11 w-full rounded-xl border px-3 text-sm outline-none placeholder:text-[#9aa4ba] focus:border-focus ${writeErrors.title ? 'border-error' : 'border-line'}`} />
            {writeErrors.title && <p className="mb-2 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />제목을 입력해 주세요.</p>}
            <textarea value={writeContent} onChange={(event) => { setWriteContent(event.target.value); setWriteErrors((current) => ({ ...current, content: false })) }} placeholder="내용을 입력하세요" aria-label="내용" className={`h-48 w-full resize-none rounded-xl border p-3 text-sm outline-none placeholder:text-[#9aa4ba] focus:border-focus ${writeErrors.content ? 'border-error' : 'border-line'}`} />
            {writeErrors.content && <p className="mt-1 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />내용을 입력해 주세요.</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-sub"><Icon name="lock" className="size-4 shrink-0 text-brand" />작성자는 기수만 표시돼요. 이름·학번은 공개되지 않아요.</p>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="h-9 rounded-lg border border-line px-4 text-xs text-brand">취소</button><button type="submit" className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover">등록</button></div>
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
            <div className="mt-4">
              {reportReasons.map((reason) => (
                <button key={reason} onClick={() => setReportReason(reason)} className="flex h-11 w-full items-center justify-between border-b border-[#edf0f5] text-left text-xs last:border-0">
                  {reason}<span className={`flex size-5 items-center justify-center rounded-full border ${reportReason === reason ? 'border-primary bg-primary text-white' : 'border-line text-transparent'}`}>{reportReason === reason ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setModal(null)} className="h-9 rounded-lg border border-line px-4 text-xs text-brand">취소</button><button onClick={() => { setModal(null); showToast('신고가 접수됐어요') }} className="h-9 rounded-lg bg-primary px-4 text-xs text-white">신고하기</button></div>
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

function PostCard({ post, onOpen, onLike }: { post: CommunityPost; onOpen: () => void; onLike: () => void }) {
  return (
    <article className="rounded-[20px] border border-[#edf1f8] bg-white p-4 shadow-[0_4px_14px_rgba(37,56,95,0.05)] transition hover:shadow-[0_7px_18px_rgba(37,56,95,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[#9aa4ba]"><div className="flex min-w-0 items-center gap-2"><span className="rounded-full bg-[#edf3ff] px-2 py-1 font-medium text-brand">{post.cohort}</span><span className="truncate">{post.author} · {post.time}</span></div><div className="flex shrink-0 items-center gap-3"><span className="inline-flex items-center gap-1"><Icon name="heart" className="size-3.5" />{post.likes}</span><span className="inline-flex items-center gap-1"><Icon name="chat" className="size-3.5" />{post.comments.length}</span></div></div>
      <button onClick={onOpen} className="block w-full text-left"><h2 className="text-sm font-semibold text-ink">{post.title}</h2><p className="mt-2 line-clamp-1 text-xs leading-5 text-sub">{post.content}</p></button>
      <button onClick={onLike} aria-label="좋아요" className="sr-only">좋아요</button>
    </article>
  )
}

function PostDetail({ post, onBack, onLike, onComment, commentDraft, onCommentDraftChange, onDelete, onReport }: { post: CommunityPost; onBack: () => void; onLike: () => void; onComment: (event: FormEvent<HTMLFormElement>) => void; commentDraft: string; onCommentDraftChange: (value: string) => void; onDelete: () => void; onReport: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="mx-auto max-w-[760px]">
      <header className="mb-5 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-xs text-sub hover:text-ink"><Icon name="chevron-left" className="size-4" />{post.cohort} 게시판</button><button aria-label="게시글 메뉴" onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 text-sub hover:bg-white"><Icon name="more" className="size-5" /></button></header>
      {menuOpen && <div className="relative"><div className="absolute right-0 top-[-18px] z-10 w-32 rounded-xl border border-line bg-white p-1 shadow-lg"><button onClick={() => { setMenuOpen(false); onReport() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[#f6f8fb]"><Icon name="flag" className="size-4" />신고하기</button><button onClick={() => { setMenuOpen(false); onDelete() }} className="w-full rounded-lg px-3 py-2 text-left text-xs text-error hover:bg-[#fbf0f1]">게시글 삭제</button></div></div>}
      <article className="rounded-[20px] border border-[#edf1f8] bg-white p-5 shadow-[0_4px_14px_rgba(37,56,95,0.05)]">
        <div className="flex items-center gap-2 text-xs text-sub"><span className="rounded-full bg-[#edf3ff] px-2 py-1 font-medium text-brand">{post.cohort}</span><span>{post.author} · {post.time}</span></div>
        <h1 className="mt-3 text-xl font-bold">{post.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink">{post.content}</p>
        <div className="mt-5 flex gap-2"><button onClick={onLike} className="flex h-8 items-center gap-1.5 rounded-full bg-[#edf3ff] px-3 text-xs text-brand"><Icon name="heart" className="size-4" />{post.likes}</button><span className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-sub"><Icon name="chat" className="size-4" />{post.comments.length}</span></div>
      </article>
      <section className="mt-3 rounded-[20px] border border-[#edf1f8] bg-white p-5 shadow-[0_4px_14px_rgba(37,56,95,0.05)]"><h2 className="mb-4 text-sm font-semibold">댓글 {post.comments.length}</h2>
        <div className="space-y-4">{post.comments.map((comment) => <article key={comment.id} className="flex justify-between gap-3"><div><p className="text-xs text-sub"><strong className="mr-2 font-semibold text-ink">{comment.author}</strong>· {comment.time}</p><p className="mt-1 text-xs leading-5 text-ink">{comment.content}</p></div><button aria-label="댓글 메뉴" className="self-start text-sub">···</button></article>)}</div>
        <form onSubmit={onComment} className="mt-5 flex gap-2"><input value={commentDraft} onChange={(event) => onCommentDraftChange(event.target.value)} placeholder="댓글 달기" aria-label="댓글 달기" className="h-10 min-w-0 flex-1 rounded-full border border-line px-4 text-xs outline-none focus:border-focus" /><button disabled={!commentDraft.trim()} className="h-10 rounded-lg bg-primary px-4 text-xs text-white disabled:bg-[#b9cef7]">등록</button></form>
      </section>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#171b2a]/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>{children}</div>
}

export default CommunityPage