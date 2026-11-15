import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import Icon from '../common/Icon'

export type AppSection = 'home' | 'chat' | 'community' | 'history'

type AppLayoutProps = {
  activeSection: AppSection | 'profile'
  activeRecentChat?: string
  children: ReactNode
  onNewChat: () => void
  onRecentChat: (title: string) => void
  onSectionChange: (section: AppSection) => void
}

const navigation: { id: AppSection; label: string; icon: 'home' | 'chat' | 'users' | 'history' }[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'chat', label: '채팅', icon: 'chat' },
  { id: 'community', label: '커뮤니티', icon: 'users' },
  { id: 'history', label: '기록', icon: 'history' },
]

function AppLayout({ activeSection, activeRecentChat, children, onNewChat, onRecentChat, onSectionChange }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f8fc] text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-5 md:flex">
        <a href="/" className="mb-5 flex items-center gap-3 px-1" aria-label="hopes 홈">
          <span className="flex size-10 items-center justify-center rounded-xl border border-[#e9eef8] bg-white shadow-sm">
            <img src={logo} alt="" className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-base font-semibold leading-5 text-ink">
              hopes
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e8ebf2] bg-white py-0.5 pl-1 pr-1.5 text-[9px] font-semibold leading-none text-ink">
                <span aria-hidden="true" className="flex size-4 items-center justify-center gap-[2px] rounded-md bg-[#f2f4f8]">
                  <span className="h-2.5 w-1 -rotate-[18deg] rounded-full bg-[#f0ca4e]" />
                  <span className="h-3 w-1 -rotate-[18deg] rounded-full bg-[#f0ca4e]" />
                </span>
                Native
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-sub">광주소프트웨어마이스터고</span>
          </span>
        </a>

        <button
          onClick={onNewChat}
          className="mb-4 flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-medium shadow-[0_3px_10px_rgba(27,29,41,0.05)] transition hover:border-focus hover:text-primary"
        >
          <Icon name="plus" className="size-4 text-primary" /> 새 대화
        </button>

        <nav className="space-y-1" aria-label="주 메뉴">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${activeSection === item.id ? 'bg-[#eaf0fd] font-medium text-primary' : 'text-sub hover:bg-[#f5f7fb]'}`}
            >
              <Icon name={item.icon} className="size-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="my-4 border-t border-line" />
        <div className="mb-2 text-xs text-[#9aa4ba]">최근 대화</div>
        {[
          '기숙사 하루 일과가 어떻게 돼?',
          'Frontend는 뭐부터 공부하면 좋아?',
          '동아리는 언제 정해?',
          '입학하려면 뭘 준비해야 해?',
        ].map((title) => (
          <button
            key={title}
            onClick={() => onRecentChat(title)}
            aria-current={activeRecentChat === title ? 'page' : undefined}
            className={`truncate rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-[#f5f7fb] ${activeRecentChat === title ? 'bg-[#f6f8fb] font-medium text-ink' : 'text-sub'}`}
          >
            {title}
          </button>
        ))}

        <Link to="/my-page" aria-current={activeSection === 'profile' ? 'page' : undefined} className={`mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-left ${activeSection === 'profile' ? 'bg-[#eaf0fd]' : 'bg-[#f6f8fb]'}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf0fd] text-xs font-semibold text-primary">임</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">임서하</span>
            <span className="block truncate text-[11px] text-sub">인공지능과 · 10기</span>
          </span>
          <Icon name="settings" className="size-[17px] text-[#9aa4ba]" />
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2 md:hidden">
          <img src={logo} alt="" className="size-7" />
          <span className="font-semibold">hopes</span>
          <button onClick={onNewChat} className="ml-auto flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-primary">
            <Icon name="plus" className="size-4" /> 새 대화
          </button>
        </div>
        <nav className="grid grid-cols-4 border-b border-line bg-white px-2 py-1 md:hidden" aria-label="주 메뉴">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] ${activeSection === item.id ? 'text-primary' : 'text-sub'}`}
            >
              <Icon name={item.icon} className="size-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}

export default AppLayout