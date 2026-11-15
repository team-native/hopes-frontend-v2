import type { ReactNode } from 'react'

interface UserBubbleProps {
  children: ReactNode
}

/** 내가 보낸 말풍선 (Chat/Bubble User) — 오른쪽 정렬, 파란 배경 */
function UserBubble({ children }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] rounded-[20px] rounded-br-[6px] bg-bg-brand px-4 py-2.5 text-label whitespace-pre-wrap break-words text-text-on-brand shadow-cloud-brand">
        {children}
      </p>
    </div>
  )
}

export default UserBubble
