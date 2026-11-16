import { BedDouble, type LucideIcon } from 'lucide-react'
import IconTile from '../common/IconTile'

interface QuestionCardProps {
  question: string
  /** 분류 (예: "학교생활") */
  category: string
  icon?: LucideIcon
  onClick: () => void
}

/** 추천 질문 카드 (Web/Question Card) — 아이콘 + 질문 + 분류 */
function QuestionCard({ question, category, icon = BedDouble, onClick }: QuestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-border-subtle bg-bg-surface p-md text-left shadow-cloud-sm transition hover:border-border-brand"
    >
      <IconTile icon={icon} size="md" />
      <p className="mt-sm text-label-strong">{question}</p>
      <p className="mt-1 text-[11px] text-text-tertiary">{category}</p>
    </button>
  )
}

export default QuestionCard
