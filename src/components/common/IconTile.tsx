import type { LucideIcon } from 'lucide-react'

interface IconTileProps {
  icon: LucideIcon
  /** sm 24 (Icon/Tile) / md 32 (추천 질문 · 질문 카드 앞) */
  size?: 'sm' | 'md'
}

/** 연파랑 네모 안의 파랑 아이콘 (장식용) */
function IconTile({ icon: Icon, size = 'sm' }: IconTileProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-bg-brand-soft text-icon-brand ${
        size === 'sm' ? 'size-6 rounded-[8px]' : 'size-8 rounded-[10px]'
      }`}
      aria-hidden
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={1.75} />
    </span>
  )
}

export default IconTile
