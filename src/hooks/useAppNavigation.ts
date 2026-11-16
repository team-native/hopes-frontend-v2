import { useNavigate } from 'react-router-dom'
import type { SidebarMenu } from '../components/layout/Sidebar'
import { ROUTES } from '../constants/routes'

/** 코드에서 화면을 옮길 때 쓰는 공통 이동 함수 (메뉴 링크는 Sidebar가 직접 처리) */
function useAppNavigation() {
  const navigate = useNavigate()

  return {
    goToSection: (section: SidebarMenu) => navigate(ROUTES[section]),
    startNewChat: () => navigate(ROUTES.chat),
    openConversation: (conversationId: string) => navigate(ROUTES.chatDetail(encodeURIComponent(conversationId))),
  }
}

export default useAppNavigation
