import { mockProfile } from './profile'

// API 연동 전 커뮤니티 목업. 실제 연동 시 게시글 목록 API 응답으로 대체한다.
// 작성자는 익명이지만 본인 여부 판단을 위해 서버가 authorId(또는 isMine)를 내려준다고 가정한다.
// 화면에는 authorCohort(작성 시점의 로그인 사용자 기수)만 표시한다.

export const boards = ['전체', '8기', '9기', '10기', '11기'] as const
export type Board = (typeof boards)[number]

export type CommunityComment = {
  id: string
  authorId: string
  authorCohort: string
  time: string
  content: string
}

export type CommunityPost = {
  id: string
  board: Board
  authorId: string
  authorCohort: string
  time: string
  title: string
  content: string
  likes: number
  likedByMe: boolean
  comments: CommunityComment[]
}

const ME = mockProfile.id

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'wifi',
    board: '10기',
    authorId: ME,
    authorCohort: '10기',
    time: '10분 전',
    title: '기숙사 와이파이 다들 잘 돼?',
    content: '3층 끝방인데 저녁만 되면 너무 느려져서 과제 제출이 힘들어. 다른 층은 어떤지, 해결 방법 아는 사람 있으면 알려줘!',
    likes: 12,
    likedByMe: false,
    comments: [
      { id: 'wifi-c1', authorId: 'user-a', authorCohort: '10기', time: '5분 전', content: '2층도 저녁엔 느려. 공유기 위치 문제 같아.' },
      { id: 'wifi-c2', authorId: 'user-b', authorCohort: '9기', time: '3분 전', content: '사감 선생님께 말씀드리면 점검해 주신대!' },
      { id: 'wifi-c3', authorId: ME, authorCohort: '10기', time: '방금', content: '오 고마워, 내일 말씀드려 볼게.' },
    ],
  },
  {
    id: 'club-interview',
    board: '전체',
    authorId: 'user-c',
    authorCohort: '10기',
    time: '1시간 전',
    title: '전공 동아리 면접 후기 공유',
    content: '어제 보고 왔는데 생각보다 분위기 편했어. 질문은 주로 지원 동기 위주였음.',
    likes: 34,
    likedByMe: false,
    comments: [
      { id: 'club-c1', authorId: 'user-b', authorCohort: '9기', time: '40분 전', content: '어떤 질문 받았는지 알려줄 수 있어?' },
      { id: 'club-c2', authorId: ME, authorCohort: '10기', time: '20분 전', content: '관심 분야랑 만들어 보고 싶은 걸 물어봤어.' },
    ],
  },
  {
    id: 'job-prep',
    board: '9기',
    authorId: 'user-d',
    authorCohort: '9기',
    time: '3시간 전',
    title: '취업 준비 언제부터 시작했어?',
    content: '2학년 여름방학부터 포트폴리오 만들기 시작했는데 늦은 건지 모르겠어.',
    likes: 21,
    likedByMe: false,
    comments: [
      { id: 'job-c1', authorId: 'user-e', authorCohort: '9기', time: '1시간 전', content: '지금부터 시작해도 충분해. 작은 프로젝트부터 완성해 봐!' },
      { id: 'job-c2', authorId: ME, authorCohort: '10기', time: '2시간 전', content: '관심 분야 정리부터 해두면 도움이 돼.' },
    ],
  },
  {
    id: 'laundry',
    board: '10기',
    authorId: ME,
    authorCohort: '10기',
    time: '어제',
    title: '기숙사 세탁실 이용 시간 아는 사람?',
    content: '주말에도 밤 10시까지 쓸 수 있는지 궁금해.',
    likes: 4,
    likedByMe: false,
    comments: [
      { id: 'laundry-c1', authorId: 'user-f', authorCohort: '8기', time: '어제', content: '층마다 운영 시간이 다를 수 있어서 공지 확인해 봐!' },
      { id: 'laundry-c2', authorId: 'user-a', authorCohort: '10기', time: '어제', content: '우리 층은 10시까지였어.' },
    ],
  },
]
