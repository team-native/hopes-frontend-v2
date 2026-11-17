import { useState } from 'react'

/**
 * 좋아요 하트 모션 — 누른 순간에만 튀어 오르게 해요 (처음 그릴 때는 가만히)
 * const [popKey, pop] = useLikePop()  →  누를 때 pop(), <LikeHeart popKey={popKey} … />
 */
function useLikePop() {
  const [popKey, setPopKey] = useState(0)
  return [popKey, () => setPopKey((key) => key + 1)] as const
}

export default useLikePop
