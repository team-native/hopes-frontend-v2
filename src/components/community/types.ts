/** 커뮤니티 게시글 */
export interface Post {
  id: string
  /** 게시판 이름 (예: "10기", "전체") */
  board: string
  title: string
  content: string
  /** 작성자 기수 (이름 대신 기수만 공개) */
  authorCohort: string
  /** "10분 전" 처럼 화면에 보여 줄 시간 */
  timeAgo: string
  likeCount: number
  commentCount: number
  /** 내가 좋아요를 눌렀는지 */
  liked?: boolean
}

/** 게시글 댓글 */
export interface Comment {
  id: string
  authorCohort: string
  timeAgo: string
  content: string
  /** 내가 쓴 댓글이면 "(나)" + 파란색 */
  isMine?: boolean
}
