import { Clock, House, MessageCircle, Plus, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import LogoMark from '../common/LogoMark'
import Sidebar, { type SidebarMenu } from './Sidebar'

const RECENT_CHAT_COUNT = 4

const MOBILE_MENUS: { key: SidebarMenu; label: string; icon: LucideIcon; to: string }[] = [
  { key: 'home', label: '홈', icon: House, to: ROUTES.home },
  { key: 'chat', label: '채팅', icon: MessageCircle, to: ROUTES.chat },
  { key: 'community', label: '커뮤니티', icon: Users, to: ROUTES.community },
  { key: 'history', label: '기록', icon: Clock, to: ROUTES.history },
]

interface AppLayoutProps {
  /** 사이드바에서 강조할 메뉴 (마이페이지 · 설정처럼 메뉴에 없는 화면은 null) */
  activeMenu?: SidebarMenu | null
  /** 지금 보고 있는 대화 id (최근 대화에서 강조) */
  activeConversationId?: string
  children: ReactNode
}

/**
 * 로그인 후 화면 공통 틀
 * 데스크톱은 공통 Sidebar, 모바일(md 미만)은 상단 바 + 메뉴 탭을 보여 줘요.
 */
function AppLayout({ activeMenu = null, activeConversationId, children }: AppLayoutProps) {
  const { startNewChat } = useAppNavigation()
  const { conversations } = useConversations()
  const { profile } = useProfile()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-bg-canvas text-text-primary">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar
          activeMenu={activeMenu}
          recentChats={conversations.slice(0, RECENT_CHAT_COUNT).map(({ id, title }) => ({ id, title }))}
          activeChatId={activeConversationId}
          user={{ name: profile.name, department: profile.department, cohort: profile.generation }}
          onNewChat={startNewChat}
          onOpenProfile={() => navigate(ROUTES.myPage)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border-subtle bg-bg-surface px-4 py-2 md:hidden">
          <Link to={ROUTES.home} aria-label="hopes 홈" className="flex items-center gap-2">
            <LogoMark size={40} />
            <span className="text-body-strong">hopes</span>
          </Link>
          <button
            type="button"
            onClick={startNewChat}
            className="ml-auto flex items-center gap-1 rounded-sm px-3 py-2 text-caption font-medium text-text-brand"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />새 대화
          </button>
        </header>
        <nav
          className="grid grid-cols-4 border-b border-border-subtle bg-bg-surface px-2 py-1 md:hidden"
          aria-label="메인 메뉴"
        >
          {MOBILE_MENUS.map(({ key, label, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              aria-current={activeMenu === key ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-sm py-2 text-[10px] ${
                activeMenu === key ? 'text-text-brand' : 'text-text-secondary'
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}

export default AppLayout
