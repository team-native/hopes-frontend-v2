import { Pencil } from 'lucide-react'

interface WriteFabProps {
  onClick: () => void
  className?: string
}

/** 오른쪽 아래 떠 있는 글쓰기 버튼 (Community/FAB Write) */
function WriteFab({ onClick, className = '' }: WriteFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="글쓰기"
      className={`flex size-12 items-center justify-center rounded-full bg-bg-brand text-icon-on-brand shadow-cloud-brand transition hover:bg-bg-brand-pressed active:scale-95 ${className}`}
    >
      <Pencil className="size-5" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

export default WriteFab
