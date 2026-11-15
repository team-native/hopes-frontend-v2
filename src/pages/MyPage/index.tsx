import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout, { type AppSection } from '../../components/layout/AppLayout'
import Icon from '../../components/common/Icon'

type Profile = {
  name: string
  bio: string
}

type ActivityTab = 'posts' | 'comments' | 'saved'

type ActivityItem = {
  title: string
  meta: string
  detail?: string
}

const activityItems: Record<ActivityTab, ActivityItem[]> = {
  posts: [
    { title: '기숙사 와이파이 다들 잘 돼?', meta: '10분 전 · ♡ 12 · 댓글 5', detail: '3층 끝방인데 저녁만 되면 너무 느려져서...' },
    { title: '기숙사 세탁실 이용 시간 아는 사람?', meta: '어제 · ♡ 4 · 댓글 2', detail: '주말에도 밤 10시까지 쓸 수 있는지 궁금해.' },
  ],
  comments: [
    { title: '지금부터 시작해도 충분해. 작은 프로젝트부터 완성해 봐!', meta: '취업 준비 언제부터 시작했어? · 1시간 전' },
    { title: '관심 분야 정리부터 해두면 도움이 돼.', meta: '취업 준비 언제부터 시작했어? · 2시간 전' },
    { title: '사감 선생님께 말씀드리면 점검해 주신대!', meta: '기숙사 와이파이 다들 잘 돼? · 어제' },
    { title: '층마다 운영 시간이 다를 수 있어서 공지 확인해 봐!', meta: '기숙사 세탁실 이용 시간 아는 사람? · 어제' },
    { title: '관심 분야랑 만들어 보고 싶은 걸 물어봤어.', meta: '전공 동아리 면접 후기 공유 · 2일 전' },
  ],
  saved: [
    { title: '기숙사 하루 일과가 어떻게 돼?', meta: '어제 저장' },
    { title: 'Frontend는 뭐부터 공부하면 좋아?', meta: '2일 전 저장' },
    { title: '입학하려면 뭘 준비해야 해?', meta: '5일 전 저장' },
  ],
}

const tabs: { id: ActivityTab; label: string; count: number }[] = [
  { id: 'posts', label: '작성글', count: 2 },
  { id: 'comments', label: '댓글', count: 5 },
  { id: 'saved', label: '저장한 대화', count: 3 },
]

function MyPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>({
    name: '임서하',
    bio: '프론트엔드에 관심 많은 10기 학생이에요.',
  })
  const [draftProfile, setDraftProfile] = useState(profile)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts')
  const [toast, setToast] = useState('')
  const [openActivityMenu, setOpenActivityMenu] = useState<string | null>(null)

  function startEditing() {
    setDraftProfile(profile)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraftProfile(profile)
    setIsEditing(false)
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draftProfile.name.trim()
    if (!name) return
    setProfile({ ...draftProfile, name })
    setIsEditing(false)
    setToast('프로필을 저장했어요')
    window.setTimeout(() => setToast(''), 2200)
  }

  function changeSection(section: AppSection) {
    if (section === 'community') {
      navigate('/community')
    } else if (section === 'history') {
      navigate('/history')
    } else if (section === 'chat') {
      navigate('/?view=chat')
    } else {
      navigate('/')
    }
  }

  return (
    <AppLayout
      activeSection="profile"
      onNewChat={() => navigate('/')}
      onRecentChat={(title) => navigate(`/?question=${encodeURIComponent(title)}`)}
      onSectionChange={changeSection}
    >
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
                  <Avatar name={draftProfile.name} />
                  <div>
                    <h2 className="font-semibold">{draftProfile.name || '이름'}</h2>
                    <p className="mt-1 text-xs text-sub">인공지능과 · 10기 · s26055@gsm.hs.kr</p>
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
                    <p className="mt-1 truncate text-xs text-sub">인공지능과 · 10기 · s26055@gsm.hs.kr</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink">{profile.bio}</p>
                <button onClick={startEditing} className="mt-4 h-9 rounded-lg border border-line px-3 text-xs font-medium text-brand transition hover:bg-[#f7f9fc]">프로필 수정</button>
              </>
            )}
          </section>

          <section className="grid grid-cols-3 divide-x divide-line rounded-[21px] border border-[#edf1f8] bg-white px-2 py-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)] lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            <Stat label="작성글" value="2" />
            <Stat label="댓글" value="5" />
            <Stat label="대화" value="12" />
          </section>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto" aria-label="마이페이지 활동">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${activeTab === tab.id ? 'border-[#bfd2ff] bg-[#edf3ff] font-medium text-brand' : 'border-line bg-white text-sub hover:border-[#d7dfef]'}`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </nav>

        <section className="mt-4 overflow-hidden rounded-[21px] border border-[#edf1f8] bg-white px-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)]" aria-live="polite">
          {activityItems[activeTab].map((item) => {
            const menuKey = `${activeTab}-${item.title}-${item.meta}`
            const actions = activeTab === 'posts' ? ['수정', '삭제'] : activeTab === 'comments' ? ['댓글 삭제', '신고'] : ['저장 취소', '대화 열기']

            return (
              <article key={menuKey} className="relative flex min-h-[68px] items-center gap-3 border-b border-[#edf0f5] last:border-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-brand"><Icon name={activeTab === 'posts' ? 'users' : activeTab === 'comments' ? 'chat' : 'bookmark'} className="size-4" /></span>
                <div className="min-w-0 flex-1 py-3">
                  <h3 className="truncate text-sm font-medium text-ink">{item.title}</h3>
                  {item.detail && <p className="mt-1 truncate text-xs text-sub">{item.detail}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-[#9aa4ba]">{item.meta}</span>
                <div className="relative shrink-0">
                  <button
                    aria-label={`${item.title} 더보기`}
                    aria-expanded={openActivityMenu === menuKey}
                    onClick={() => setOpenActivityMenu((current) => current === menuKey ? null : menuKey)}
                    className="flex size-7 items-center justify-center rounded-md text-[#9aa4ba] transition hover:bg-[#f5f7fb] hover:text-sub"
                  >
                    <Icon name="more" className="size-4" />
                  </button>
                  {openActivityMenu === menuKey && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-28 rounded-lg border border-line bg-white p-1 shadow-lg">
                      {actions.map((action) => (
                        <button
                          key={action}
                          onClick={() => {
                            setOpenActivityMenu(null)
                            setToast(`${action} 기능은 화면 목업입니다`)
                            window.setTimeout(() => setToast(''), 2200)
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${action.includes('삭제') ? 'text-error hover:bg-[#fbf0f1]' : 'text-ink hover:bg-[#f5f7fb]'}`}
                        >
                          {action === '수정' && <Icon name="pencil" className="size-4" />}
                          {action.includes('삭제') && <Icon name="trash" className="size-4" />}
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
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
  return <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-xl font-semibold text-brand">{name.trim().charAt(0) || '임'}</span>
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between px-3 py-1.5 lg:px-4"><span className="text-xs text-sub">{label}</span><strong className="text-base font-semibold text-ink">{value}</strong></div>
}

export default MyPage