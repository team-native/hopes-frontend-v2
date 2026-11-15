import { BedDouble, ChevronRight, type LucideIcon } from 'lucide-react'
import IconTile from '../common/IconTile'

interface SuggestionRowProps {
  text: string
  /** 앞쪽 아이콘 (기본: 침대 — 기숙사) */
  icon?: LucideIcon
  onClick: () => void
}

/** 추천 질문 한 줄 버튼 (Chat/Suggestion Row) */
function SuggestionRow({ text, icon = BedDouble, onClick }: SuggestionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-[360px] items-center gap-3 rounded-md border border-border-subtle bg-bg-surface py-2.5 pr-3 pl-2.5 text-left shadow-cloud-sm transition hover:border-border-brand"
    >
      <IconTile icon={icon} size="md" />
      <span className="min-w-0 flex-1 truncate text-caption text-text-primary">{text}</span>
      <ChevronRight className="size-4 shrink-0 text-icon-muted" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

export default SuggestionRow
