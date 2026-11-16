import type { Conversation } from '../types/conversation'

// API 연동 전 목업 대화 목록. 실제 연동 시 대화 목록 API 응답으로 대체한다.
export const mockConversations: Conversation[] = [
  {
    id: 'dorm-routine',
    title: '기숙사 하루 일과가 어떻게 돼?',
    preview: '평일은 저녁 식사 후 자습, 점호 순서로...',
    age: '어제',
    daysAgo: 1,
  },
  {
    id: 'frontend-start',
    title: 'Frontend는 뭐부터 공부하면 좋아?',
    preview: '처음에는 HTML·CSS로 간단한 페이지를...',
    age: '2일 전',
    daysAgo: 2,
  },
  {
    id: 'club-timing',
    title: '동아리는 언제 정해?',
    preview: '보통 3월 첫째 주에 동아리 박람회가...',
    age: '5일 전',
    daysAgo: 5,
  },
  {
    id: 'admission-prep',
    title: '입학하려면 뭘 준비해야 해?',
    preview: '자기소개서와 면접 준비가 가장 중요해요...',
    age: '2주 전',
    daysAgo: 14,
  },
  {
    id: 'department-major',
    title: '과랑 전공이랑 뭐가 달라?',
    preview: '과는 학교의 학과를 말하고, 전공은...',
    age: '3주 전',
    daysAgo: 21,
  },
]
