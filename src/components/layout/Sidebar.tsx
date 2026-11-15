import { Clock, House, MessageCircle, Plus, Settings, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import Avatar from '../common/Avatar'
import LogoMark from '../common/LogoMark'
import NativeBadge from '../common/NativeBadge'

export type SidebarMenu = 'home' | 'chat' | 'community' | 'history'

export interface RecentChat {
  id: string
  title: string
}

export interface SidebarUser {
  name: string
  department: string
  cohort: string
}

interface SidebarProps {
  /** 지금 선택된 메뉴 (없으면 아무것도 강조 안 함) */
  activeMenu?: SidebarMenu | null
  /** 최근 대화 목록 */
  recentChats: RecentChat[]
  /** 지금 보고 있는 대화 id (최근 대화에서 강조) */
  activeChatId?: string
  user: SidebarUser
  /** "새 대화" 버튼 */
  onNewChat?: () => void
  /** 사용자 카드의 톱니바퀴 버튼 */
  onOpenSettings?: () => void
  className?: string
}

const MENUS: { key: SidebarMenu; label: string; icon: LucideIcon; to: string }[] = [
  { key: 'home', label: '홈', icon: House, to: ROUTES.home },
  { key: 'chat', label: '채팅', icon: MessageCircle, to: ROUTES.chat },
  { key: 'community', label: '커뮤니티', icon: Users, to: ROUTES.community },
  { key: 'history', label: '기록', icon: Clock, to: ROUTES.history },
]

/** 웹 왼쪽 사이드바 (너비 264, 높이는 감싸는 요소를 꽉 채움 → 보통 h-screen 안에 넣어 사용) */
function Sidebar({
  activeMenu = null,
  recentChats,
  activeChatId,
  user,
  onNewChat,
  onOpenSettings,
  className = '',
}: SidebarProps) {
  return (
    <aside
      className={`flex h-full w-[264px] shrink-0 flex-col border-r border-border-subtle bg-bg-surface p-md ${className}`}
    >
      {/* 로고 */}
      <div className="flex items-center gap-2.5 px-1.5 pt-xs">
        <LogoMark size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-heading font-medium">hopes</span>
            <NativeBadge size="sm" />
          </div>
          <p className="truncate text-caption text-text-secondary">광주소프트웨어마이스터고</p>
        </div>
      </div>

      {/* 새 대화 */}
      <button
        type="button"
        onClick={onNewChat}
        className="mt-lg flex h-10 w-full items-center justify-center gap-1.5 rounded-sm border border-border-subtle bg-bg-surface text-label-strong font-medium shadow-cloud-sm transition hover:bg-bg-canvas"
      >
        <Plus className="size-4 text-icon-brand" strokeWidth={2} aria-hidden />새 대화
      </button>

      {/* 메뉴 */}
      <nav className="mt-lg" aria-label="메인 메뉴">
        <ul className="space-y-0.5">
          {MENUS.map(({ key, label, icon: Icon, to }) => {
            const active = key === activeMenu
            return (
              <li key={key}>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-10 items-center gap-2.5 rounded-sm px-3 text-label transition ${
                    active
                      ? 'bg-bg-brand-soft font-medium text-text-brand'
                      : 'text-text-secondary hover:bg-bg-canvas hover:text-text-primary'
                  }`}
                >
                  <Icon
                    className={`size-[18px] ${active ? 'text-icon-brand' : 'text-icon-muted'}`}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <hr className="mt-md border-border-subtle" />

      {/* 최근 대화 */}
      <section className="mt-md min-h-0 flex-1 overflow-y-auto" aria-labelledby="recent-chats-title">
        <h2 id="recent-chats-title" className="text-caption text-text-tertiary">
          최근 대화
        </h2>
        <ul className="mt-1.5">
          {recentChats.map((chat) => {
            const active = chat.id === activeChatId
            return (
              <li key={chat.id}>
                <Link
                  to={ROUTES.chatDetail(chat.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`block truncate rounded-sm px-3 py-2 text-label transition ${
                    active
                      ? 'bg-bg-canvas font-semibold text-text-primary'
                      : 'text-text-secondary hover:bg-bg-canvas hover:text-text-primary'
                  }`}
                >
                  {chat.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 사용자 */}
      <div className="mt-md flex items-center gap-2.5 rounded-md bg-bg-canvas py-2.5 pr-2 pl-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-strong font-medium">{user.name}</p>
          <p className="truncate text-caption text-text-secondary">
            {user.department} · {user.cohort}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="설정"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-surface hover:text-icon-default"
        >
          <Settings className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
