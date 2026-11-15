import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

/** 작은 연파랑 알약 라벨 (Community/Board Badge — "전체", "10기" 등) */
function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-full bg-bg-brand-soft px-2 text-[11px] leading-none font-medium text-text-brand ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
