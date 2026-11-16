import type { Profile } from '../types/profile'

// API 연동 전 목업 사용자. 실제 연동 시 내 정보 조회 API 응답으로 대체한다.
export const mockProfile: Profile = {
  id: 'user-s26055',
  name: '임서하',
  bio: '프론트엔드에 관심 많은 10기 학생이에요.',
  department: '인공지능과',
  generation: '10기',
  email: 's26055@gsm.hs.kr',
}
