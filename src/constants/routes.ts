/**
 * 페이지 주소 모음
 * TODO: 메인 · 채팅 · 커뮤니티 · 기록 화면을 맡은 팀원과 주소를 맞춰 주세요
 */
export const ROUTES = {
  home: '/',
  chat: '/chat',
  chatDetail: (id: string) => `/chat/${id}`,
  community: '/community',
  history: '/history',
  login: '/login',
  signup: '/signup',
  findPassword: '/find-password',
} as const
