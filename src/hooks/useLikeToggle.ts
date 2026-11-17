import { useRef } from 'react'
import { getPost, setPostLike } from '../api/community'

export type LikeState = { liked: boolean; likeCount: number }

interface UseLikeToggleOptions {
  /** 화면의 좋아요 상태를 바꿀 때 (먼저 반영 · 되돌리기 · 서버 값 맞추기 모두 이걸로) */
  onChange: (postId: string, state: LikeState) => void
  /** 좋아요 요청이 실패했을 때 (예: 토스트) */
  onError?: () => void
}

/**
 * 게시글 좋아요 토글 (커뮤니티 목록 · 상세 · 홈 인기글 공통)
 * 1. 화면을 먼저 바꾸고 서버에 좋아요/취소 요청을 보내요.
 * 2. 요청이 실패하면 원래대로 되돌리고 onError를 불러요.
 * 3. 요청이 성공하면 getPost로 서버 숫자에 맞춰요. 이 동기화가 실패해도 화면 값은 그대로 둬요.
 *
 * toggle()은 요청을 시작했으면 true, 같은 글의 요청이 아직 진행 중이라 무시했으면 false를 돌려줘요.
 * (false면 하트 모션도 재생하지 않아요)
 */
function useLikeToggle({ onChange, onError }: UseLikeToggleOptions) {
  const pendingIds = useRef(new Set<string>())
  // 동기화 응답이 늦게 와서 그 뒤에 누른 결과를 덮어쓰지 않게, 글마다 몇 번째 토글인지 세요
  const versions = useRef(new Map<string, number>())

  function toggle(postId: string, current: LikeState) {
    if (pendingIds.current.has(postId)) return false
    pendingIds.current.add(postId)
    const version = (versions.current.get(postId) ?? 0) + 1
    versions.current.set(postId, version)

    const liked = !current.liked
    onChange(postId, { liked, likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)) })

    void (async () => {
      try {
        await setPostLike(postId, liked)
      } catch {
        onChange(postId, current)
        onError?.()
        return
      } finally {
        pendingIds.current.delete(postId)
      }
      try {
        const post = await getPost(postId)
        if (versions.current.get(postId) === version) {
          onChange(postId, { liked: post.likedByMe, likeCount: post.likeCount })
        }
      } catch {
        // 좋아요는 이미 반영됐으니 숫자 동기화 실패는 무시하고 화면 값을 그대로 둬요
      }
    })()
    return true
  }

  return toggle
}

export default useLikeToggle
