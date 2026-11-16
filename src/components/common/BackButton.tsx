import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

/** ← + 글자 뒤로 가기 버튼 (예: "← 10기 게시판") */
function BackButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-caption text-text-secondary transition hover:text-text-primary"
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
      {children}
    </button>
  )
}

export default BackButton
