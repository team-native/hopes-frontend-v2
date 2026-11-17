import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import MobileNav from './MobileNav'
import Sidebar, { type SidebarMenu } from './Sidebar'

const RECENT_CHAT_COUNT = 4

interface AppLayoutProps {
  /** 사이드바에서 강조할 메뉴 (마이페이지 · 설정처럼 메뉴에 없는 화면은 null) */
  activeMenu?: SidebarMenu | null
  /** 지금 보고 있는 대화 id (최근 대화에서 강조) */
  activeConversationId?: string
  /**
   * true면 화면 높이에 딱 맞춰요(페이지 전체는 스크롤 안 됨). 채팅 화면처럼 안쪽 영역만 스크롤할 때 써요.
   * 모바일 위쪽 메뉴 높이를 빼고 남은 높이를 children이 채워요(children은 flex-1 · min-h-0).
   */
  fitScreen?: boolean
  children: ReactNode
}

/**
 * 로그인 후 화면 공통 틀
 * 데스크톱은 공통 Sidebar, 모바일(md 미만)은 상단 바 + 메뉴 탭을 보여 줘요.
 */
function AppLayout({ activeMenu = null, activeConversationId, fitScreen = false, children }: AppLayoutProps) {
  const { startNewChat } = useAppNavigation()
  const { conversations } = useConversations()
  const { profile } = useProfile()
  const navigate = useNavigate()

  return (
    <div className={`flex bg-bg-canvas text-text-primary ${fitScreen ? 'h-dvh overflow-hidden' : 'min-h-screen'}`}>
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar
          activeMenu={activeMenu}
          recentChats={conversations.slice(0, RECENT_CHAT_COUNT).map(({ id, title }) => ({ id, title }))}
          activeChatId={activeConversationId}
          user={{ name: profile.name, department: profile.department, cohort: profile.generation }}
          onNewChat={startNewChat}
          onOpenProfile={() => navigate(ROUTES.myPage)}
          onOpenSettings={() => navigate(ROUTES.settings)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav activeMenu={activeMenu} onNewChat={startNewChat} />
        <div className="flex min-h-0 min-w-0 flex-1 animate-fade-in flex-col">{children}</div>
      </div>
    </div>
  )
}

export default AppLayout
