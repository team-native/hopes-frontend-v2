import { useNavigate } from 'react-router-dom'
import type { AppSection } from '../components/layout/AppLayout'

const sectionPaths: Record<AppSection, string> = {
  home: '/',
  chat: '/chat',
  community: '/community',
  history: '/history',
}

// 사이드바·모바일 메뉴 등 화면 간 공통 이동 동작
function useAppNavigation() {
  const navigate = useNavigate()

  return {
    goToSection: (section: AppSection) => navigate(sectionPaths[section]),
    startNewChat: () => navigate(sectionPaths.chat),
    openConversation: (conversationId: string) => navigate(`/chat/${encodeURIComponent(conversationId)}`),
  }
}

export default useAppNavigation
