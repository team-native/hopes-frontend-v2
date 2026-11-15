import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout, { type AppSection } from '../../components/layout/AppLayout'
import Icon from '../../components/common/Icon'

type Conversation = {
  id: string
  title: string
  preview: string
  age: string
  daysAgo: number
}

const initialConversations: Conversation[] = [
  { id: 'dorm-routine', title: '기숙사 하루 일과가 어떻게 돼?', preview: '평일은 저녁 식사 후 자습, 점호 순서로...', age: '어제', daysAgo: 1 },
  { id: 'frontend-start', title: 'Frontend는 뭐부터 공부하면 좋아?', preview: '처음에는 HTML·CSS로 간단한 페이지를...', age: '2일 전', daysAgo: 2 },
  { id: 'club-timing', title: '동아리는 언제 정해?', preview: '보통 3월 첫째 주에 동아리 박람회가...', age: '5일 전', daysAgo: 5 },
  { id: 'admission-prep', title: '입학하려면 뭘 준비해야 해?', preview: '자기소개서와 면접 준비가 가장 중요해요...', age: '2주 전', daysAgo: 14 },
  { id: 'department-major', title: '과랑 전공이랑 뭐가 달라?', preview: '과는 학교의 학과를 말하고, 전공은...', age: '3주 전', daysAgo: 21 },
]

function HistoryPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState(initialConversations)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return conversations
    return conversations.filter(({ title, preview }) => `${title} ${preview}`.toLocaleLowerCase().includes(query))
  }, [conversations, search])

  const recent = filtered.filter(({ daysAgo }) => daysAgo <= 7)
  const older = filtered.filter(({ daysAgo }) => daysAgo > 7)

  function changeSection(section: AppSection) {
    if (section === 'community') navigate('/community')
    else if (section === 'history') navigate('/history')
    else if (section === 'chat') navigate('/?view=chat')
    else navigate('/')
  }

  function openConversation(conversation: Conversation) {
    navigate(`/?question=${encodeURIComponent(conversation.title)}`)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setConversations((current) => current.filter(({ id }) => id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <AppLayout
      activeSection="history"
      onNewChat={() => navigate('/?view=chat')}
      onRecentChat={(title) => navigate(`/?question=${encodeURIComponent(title)}`)}
      onSectionChange={changeSection}
    >
      <main className="mx-auto w-full max-w-[900px] px-5 pb-10 pt-5 md:px-8 md:pt-6">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight md:text-2xl">대화 기록</h1>
            <p className="mt-1 text-sm text-sub">이전 대화를 이어서 볼 수 있어요.</p>
          </div>
          <button onClick={() => navigate('/?view=chat')} className="h-9 shrink-0 rounded-lg bg-primary px-3 text-xs font-medium text-white transition hover:bg-primary-hover">새 대화</button>
        </header>

        <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 shadow-[0_3px_12px_rgba(26,42,78,0.05)] focus-within:border-focus">
          <Icon name="search" className="size-4 shrink-0 text-[#9aa4ba]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="지난 대화 검색" aria-label="지난 대화 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa4ba]" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="검색어 지우기" className="text-[#9aa4ba] hover:text-sub"><Icon name="x" className="size-4" /></button>}
        </label>

        {search && <p className="mt-3 text-xs text-sub">검색 결과 {filtered.length}개</p>}
        {filtered.length === 0 ? (
          <EmptyHistory hasSearch={Boolean(search.trim())} onNewChat={() => navigate('/?view=chat')} />
        ) : (
          <div className="mt-5 space-y-4">
            {recent.length > 0 && <ConversationGroup title={search.trim() ? '검색 결과' : '지난 7일'} conversations={recent} onOpen={openConversation} onDelete={setDeleteTarget} />}
            {older.length > 0 && <ConversationGroup title={search.trim() ? undefined : '이전'} conversations={older} onOpen={openConversation} onDelete={setDeleteTarget} />}
          </div>
        )}
      </main>

      {deleteTarget && <DeleteDialog conversation={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </AppLayout>
  )
}

function ConversationGroup({ title, conversations, onOpen, onDelete }: { title?: string; conversations: Conversation[]; onOpen: (conversation: Conversation) => void; onDelete: (conversation: Conversation) => void }) {
  return (
    <section>
      {title && <h2 className="mb-2 text-xs font-medium text-sub">{title}</h2>}
      <div className="overflow-hidden rounded-[18px] border border-[#edf1f8] bg-white px-3 shadow-[0_5px_16px_rgba(37,56,95,0.06)]">
        {conversations.map((conversation) => (
          <article key={conversation.id} className="flex min-w-0 items-center gap-2 border-b border-[#edf0f5] last:border-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-brand"><Icon name="chat" className="size-4" /></span>
            <button onClick={() => onOpen(conversation)} className="min-w-0 flex-1 py-3 text-left">
              <span className="block truncate text-xs font-semibold text-ink">{conversation.title}</span>
              <span className="mt-1 block truncate text-[11px] text-[#9aa4ba]">{conversation.preview}</span>
            </button>
            <span className="shrink-0 text-[10px] text-[#9aa4ba]">{conversation.age}</span>
            <button onClick={() => onDelete(conversation)} aria-label={`${conversation.title} 삭제`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#9aa4ba] transition hover:bg-[#f7f8fb] hover:text-sub">
              <Icon name="trash" className="size-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function EmptyHistory({ hasSearch, onNewChat }: { hasSearch: boolean; onNewChat: () => void }) {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-white text-brand shadow-[0_5px_16px_rgba(37,56,95,0.08)]">
        <Icon name={hasSearch ? 'search' : 'chat'} className="size-6" />
      </span>
      <h2 className="text-sm font-semibold text-ink">{hasSearch ? '검색 결과가 없어요' : '아직 대화가 없어요'}</h2>
      <p className="mt-1 text-xs text-sub">{hasSearch ? '다른 검색어로 다시 찾아보세요.' : '선배에게 첫 질문을 해보세요.'}</p>
      {!hasSearch && <button onClick={onNewChat} className="mt-3 h-8 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover">채팅 시작하기</button>}
    </section>
  )
}

function DeleteDialog({ conversation, onCancel, onConfirm }: { conversation: Conversation; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#161b2b]/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-history-title" className="w-full max-w-[300px] rounded-[20px] bg-white p-5 text-center shadow-2xl">
        <h2 id="delete-history-title" className="text-sm font-semibold">이 대화를 삭제할까요?</h2>
        <p className="mt-2 line-clamp-1 text-xs text-sub">{conversation.title}</p>
        <p className="mt-1 text-xs text-sub">삭제한 대화는 되돌릴 수 없어요.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="h-9 rounded-lg border border-line text-xs text-ink">취소</button>
          <button onClick={onConfirm} className="h-9 rounded-lg bg-[#fbf0f1] text-xs font-medium text-error">삭제</button>
        </div>
      </section>
    </div>
  )
}

export default HistoryPage