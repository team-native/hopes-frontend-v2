import { Clock, House, MessageCircle, Plus, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import LogoMark from '../common/LogoMark'
import type { SidebarMenu } from './Sidebar'

const MENUS: { key: SidebarMenu; label: string; icon: LucideIcon; to: string }[] = [
  { key: 'home', label: '홈', icon: House, to: ROUTES.home },
  { key: 'chat', label: '채팅', icon: MessageCircle, to: ROUTES.chat },
  { key: 'community', label: '커뮤니티', icon: Users, to: ROUTES.community },
  { key: 'history', label: '기록', icon: Clock, to: ROUTES.history },
]

interface MobileNavProps {
  activeMenu?: SidebarMenu | null
  onNewChat?: () => void
}

/** 모바일(md 미만) 상단 바 + 메뉴 탭 — 데스크톱의 Sidebar 역할 */
function MobileNav({ activeMenu = null, onNewChat }: MobileNavProps) {
  return (
    <div className="md:hidden">
      <header className="flex items-center gap-2 border-b border-border-subtle bg-bg-surface px-4 py-2">
        <Link to={ROUTES.home} aria-label="hopes 홈" className="flex items-center gap-2">
          <LogoMark size={40} />
          <span className="text-body-strong">hopes</span>
        </Link>
        <button
          type="button"
          onClick={onNewChat}
          className="ml-auto flex items-center gap-1 rounded-sm px-3 py-2 text-caption font-medium text-text-brand"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />새 대화
        </button>
      </header>
      <nav className="grid grid-cols-4 border-b border-border-subtle bg-bg-surface px-2 py-1" aria-label="메인 메뉴">
        {MENUS.map(({ key, label, icon: Icon, to }) => (
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
    </div>
  )
}

export default MobileNav
