import { useState, type FormEvent } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Icon, { type IconName } from '../../components/common/Icon'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import { mockMyComments, mockMyPosts, mockSavedConversations } from '../../mocks/activity'

type ActivityTab = 'posts' | 'comments' | 'saved'

type ActivityAction = {
  label: string
  icon?: IconName
  danger?: boolean
  /** 없으면 아직 구현되지 않은 기능으로 보고 메뉴에서 비활성화한다. */
  onSelect?: () => void
}

type ActivityRow = {
  id: string
  icon: IconName
  title: string
  detail?: string
  meta: string
  actions: ActivityAction[]
}

function MyPage() {
  const { openConversation } = useAppNavigation()
  const { conversations } = useConversations()
  const { profile, updateProfile } = useProfile()
  const [draftProfile, setDraftProfile] = useState({ name: profile.name, bio: profile.bio })
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts')
  const [posts, setPosts] = useState(mockMyPosts)
  const [comments, setComments] = useState(mockMyComments)
  const [saved, setSaved] = useState(mockSavedConversations)
  const [toast, setToast] = useState('')
  const [openActivityMenu, setOpenActivityMenu] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function startEditing() {
    setDraftProfile({ name: profile.name, bio: profile.bio })
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draftProfile.name.trim()
    if (!name) return
    updateProfile({ name, bio: draftProfile.bio })
    setIsEditing(false)
    showToast('프로필을 저장했어요')
  }

  // TODO: 삭제·저장 취소는 API 연동 전까지 화면 목록에서만 제거된다(새로고침 시 복구).
  const rowsByTab: Record<ActivityTab, ActivityRow[]> = {
    posts: posts.map((post) => ({
      id: post.id,
      icon: 'users',
      title: post.title,
      detail: post.excerpt,
      meta: `${post.age} · ♡ ${post.likes} · 댓글 ${post.commentCount}`,
      actions: [
        { label: '수정', icon: 'pencil' },
        { label: '삭제', icon: 'trash', danger: true, onSelect: () => { setPosts((current) => current.filter(({ id }) => id !== post.id)); showToast('작성글을 삭제했어요') } },
      ],
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      icon: 'chat',
      title: comment.content,
      meta: `${comment.postTitle} · ${comment.age}`,
      actions: [
        { label: '댓글 삭제', icon: 'trash', danger: true, onSelect: () => { setComments((current) => current.filter(({ id }) => id !== comment.id)); showToast('댓글을 삭제했어요') } },
        { label: '신고' },
      ],
    })),
    saved: saved.map((item) => ({
      id: item.id,
      icon: 'bookmark',
      title: item.title,
      meta: item.savedAge,
      actions: [
        { label: '대화 열기', onSelect: () => openConversation(item.conversationId) },
        { label: '저장 취소', onSelect: () => { setSaved((current) => current.filter(({ id }) => id !== item.id)); showToast('저장을 취소했어요') } },
      ],
    })),
  }

  const tabs: { id: ActivityTab; label: string; count: number }[] = [
    { id: 'posts', label: '작성글', count: posts.length },
    { id: 'comments', label: '댓글', count: comments.length },
    { id: 'saved', label: '저장한 대화', count: saved.length },
  ]

  const profileMeta = `${profile.department} · ${profile.generation} · ${profile.email}`
  const activeRows = rowsByTab[activeTab]

  return (
    <AppLayout activeSection="profile">
      <main className="mx-auto w-full max-w-[980px] px-5 pb-10 pt-5 md:px-8 md:pt-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight md:text-2xl">마이페이지</h1>
            <p className="mt-1 text-sm text-sub">내 정보와 활동</p>
          </div>
          <button onClick={startEditing} aria-label="프로필 설정" className="flex size-10 items-center justify-center rounded-xl bg-white text-sub shadow-[0_3px_12px_rgba(26,42,78,0.08)] transition hover:text-brand">
            <Icon name="settings" />
          </button>
        </header>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <section className="rounded-[21px] border border-[#edf1f8] bg-white p-5 shadow-[0_5px_16px_rgba(37,56,95,0.06)] md:p-6">
            {isEditing ? (
              <form onSubmit={saveProfile}>
                <div className="mb-5 flex items-center gap-3">
                  <Avatar name={draftProfile.name || profile.name} />
                  <div>
                    <h2 className="font-semibold">{draftProfile.name || '이름'}</h2>
                    <p className="mt-1 text-xs text-sub">{profileMeta}</p>
                  </div>
                </div>
                <label className="mb-3 block text-xs text-sub">
                  이름
                  <input value={draftProfile.name} onChange={(event) => setDraftProfile((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-focus" />
                </label>
                <label className="block text-xs text-sub">
                  자기소개 <span className="text-[#9aa4ba]">(AI 응답 개인화에 활용돼요)</span>
                  <textarea value={draftProfile.bio} onChange={(event) => setDraftProfile((current) => ({ ...current, bio: event.target.value }))} rows={2} className="mt-1.5 w-full resize-none rounded-xl border border-line p-3 text-sm text-ink outline-none focus:border-focus" />
                </label>
                {!draftProfile.name.trim() && <p className="mt-1 text-xs text-error">이름을 입력해 주세요.</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={cancelEditing} className="h-9 rounded-lg border border-line px-4 text-xs text-brand">취소</button>
                  <button type="submit" disabled={!draftProfile.name.trim()} className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-[#b9cef7]">저장</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <Avatar name={profile.name} />
                  <div className="min-w-0 flex-1 pt-1">
                    <h2 className="text-base font-semibold">{profile.name}</h2>
                    <p className="mt-1 truncate text-xs text-sub">{profileMeta}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink">{profile.bio}</p>
                <button onClick={startEditing} className="mt-4 h-9 rounded-lg border border-line px-3 text-xs font-medium text-brand transition hover:bg-[#f7f9fc]">프로필 수정</button>
              </>
            )}
          </section>

          <section className="grid grid-cols-3 divide-x divide-line rounded-[21px] border border-[#edf1f8] bg-white px-2 py-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)] lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            <Stat label="작성글" value={posts.length} />
            <Stat label="댓글" value={comments.length} />
            <Stat label="대화" value={conversations.length} />
          </section>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto" aria-label="마이페이지 활동">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setOpenActivityMenu(null) }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${activeTab === tab.id ? 'border-[#bfd2ff] bg-[#edf3ff] font-medium text-brand' : 'border-line bg-white text-sub hover:border-[#d7dfef]'}`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </nav>

        <section className="mt-4 overflow-hidden rounded-[21px] border border-[#edf1f8] bg-white px-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)]" aria-live="polite">
          {activeRows.length === 0 && <p className="py-8 text-center text-xs text-sub">아직 표시할 활동이 없어요.</p>}
          {activeRows.map((row) => (
            <article key={row.id} className="relative flex min-h-[68px] items-center gap-3 border-b border-[#edf0f5] last:border-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-brand"><Icon name={row.icon} className="size-4" /></span>
              <div className="min-w-0 flex-1 py-3">
                <h3 className="truncate text-sm font-medium text-ink">{row.title}</h3>
                {row.detail && <p className="mt-1 truncate text-xs text-sub">{row.detail}</p>}
              </div>
              <span className="shrink-0 text-[11px] text-[#9aa4ba]">{row.meta}</span>
              <div className="relative shrink-0">
                <button
                  aria-label={`${row.title} 더보기`}
                  aria-expanded={openActivityMenu === row.id}
                  onClick={() => setOpenActivityMenu((current) => current === row.id ? null : row.id)}
                  className="flex size-7 items-center justify-center rounded-md text-[#9aa4ba] transition hover:bg-[#f5f7fb] hover:text-sub"
                >
                  <Icon name="more" className="size-4" />
                </button>
                {openActivityMenu === row.id && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-lg border border-line bg-white p-1 shadow-lg">
                    {row.actions.map((action) => (
                      <button
                        key={action.label}
                        disabled={!action.onSelect}
                        onClick={() => {
                          setOpenActivityMenu(null)
                          action.onSelect?.()
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs disabled:cursor-not-allowed disabled:text-[#aab3c5] disabled:hover:bg-transparent ${action.danger ? 'text-error hover:bg-[#fbf0f1]' : 'text-ink hover:bg-[#f5f7fb]'}`}
                      >
                        {action.icon && <Icon name={action.icon} className="size-4" />}
                        {action.label}
                        {!action.onSelect && <span className="ml-auto rounded-full bg-[#f2f4f8] px-1.5 py-0.5 text-[10px] text-sub">준비 중</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#202432] py-2.5 pl-3 pr-5 text-sm font-medium text-white shadow-lg">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white"><Icon name="check" className="size-4" /></span>
          <span>{toast}</span>
        </div>
      )}
    </AppLayout>
  )
}

function Avatar({ name }: { name: string }) {
  return <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-xl font-semibold text-brand">{name.trim().charAt(0)}</span>
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between px-3 py-1.5 lg:px-4"><span className="text-xs text-sub">{label}</span><strong className="text-base font-semibold text-ink">{value}</strong></div>
}

export default MyPage
