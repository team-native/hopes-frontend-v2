// API 연동 전 마이페이지 활동 목업. 실제 연동 시 각 목록 API 응답으로 대체한다.
// 개수(통계)는 하드코딩하지 않고 목록 길이로 계산한다.

export type MyPost = {
  id: string
  title: string
  excerpt: string
  age: string
  likes: number
  commentCount: number
}

export type MyComment = {
  id: string
  content: string
  postTitle: string
  age: string
}

export type SavedConversation = {
  id: string
  conversationId: string
  title: string
  savedAge: string
}

export const mockMyPosts: MyPost[] = [
  { id: 'post-wifi', title: '기숙사 와이파이 다들 잘 돼?', excerpt: '3층 끝방인데 저녁만 되면 너무 느려져서...', age: '10분 전', likes: 12, commentCount: 5 },
  { id: 'post-laundry', title: '기숙사 세탁실 이용 시간 아는 사람?', excerpt: '주말에도 밤 10시까지 쓸 수 있는지 궁금해.', age: '어제', likes: 4, commentCount: 2 },
]

export const mockMyComments: MyComment[] = [
  { id: 'comment-1', content: '지금부터 시작해도 충분해. 작은 프로젝트부터 완성해 봐!', postTitle: '취업 준비 언제부터 시작했어?', age: '1시간 전' },
  { id: 'comment-2', content: '관심 분야 정리부터 해두면 도움이 돼.', postTitle: '취업 준비 언제부터 시작했어?', age: '2시간 전' },
  { id: 'comment-3', content: '사감 선생님께 말씀드리면 점검해 주신대!', postTitle: '기숙사 와이파이 다들 잘 돼?', age: '어제' },
  { id: 'comment-4', content: '층마다 운영 시간이 다를 수 있어서 공지 확인해 봐!', postTitle: '기숙사 세탁실 이용 시간 아는 사람?', age: '어제' },
  { id: 'comment-5', content: '관심 분야랑 만들어 보고 싶은 걸 물어봤어.', postTitle: '전공 동아리 면접 후기 공유', age: '2일 전' },
]

export const mockSavedConversations: SavedConversation[] = [
  { id: 'saved-1', conversationId: 'dorm-routine', title: '기숙사 하루 일과가 어떻게 돼?', savedAge: '어제 저장' },
  { id: 'saved-2', conversationId: 'frontend-start', title: 'Frontend는 뭐부터 공부하면 좋아?', savedAge: '2일 전 저장' },
  { id: 'saved-3', conversationId: 'admission-prep', title: '입학하려면 뭘 준비해야 해?', savedAge: '5일 전 저장' },
]
