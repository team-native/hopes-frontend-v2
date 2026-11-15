import ChatInput from '../../components/chat/ChatInput'
import NativeBadge from '../../components/common/NativeBadge'
import Sidebar, { type RecentChat, type SidebarMenu } from '../../components/layout/Sidebar'

/**
 * 부품 미리보기 (개발 서버에서만: /dev/components)
 * 새 컴포넌트를 만들면 여기에 상태별로 추가해 두면 한눈에 확인할 수 있어요.
 */

const RECENT_CHATS: RecentChat[] = [
  { id: '1', title: '기숙사 하루 일과가 어떻게 돼?' },
  { id: '2', title: 'Frontend는 뭐부터 공부하면 좋아?' },
  { id: '3', title: '동아리는 언제 정해?' },
  { id: '4', title: '입학하려면 뭘 준비해야 해?' },
]

const USER = { name: '임서하', department: '인공지능과', cohort: '10기' }

const SIDEBAR_STATES: { menu: SidebarMenu | null; chatId?: string }[] = [
  { menu: 'home' },
  { menu: 'chat', chatId: '1' },
  { menu: 'community' },
  { menu: 'history' },
  { menu: null },
]

function DevComponentsPage() {
  return (
    <main className="min-h-screen bg-bg-canvas px-[111px] pt-12 pb-5xl">
      <h1 className="text-display">Web 부품 · 사이드바 · 입력창</h1>

      <section className="mt-12 flex gap-6">
        {SIDEBAR_STATES.map((state) => (
          <div key={state.menu ?? 'none'} className="h-[858px]">
            <Sidebar
              className="border-r-0"
              activeMenu={state.menu}
              activeChatId={state.chatId}
              recentChats={RECENT_CHATS}
              user={USER}
            />
          </div>
        ))}
      </section>

      <section className="mt-[55px]">
        <ChatInput onSend={(message) => console.log('send:', message)} />
      </section>

      <section className="mt-3xl">
        <NativeBadge />
      </section>
    </main>
  )
}

export default DevComponentsPage
