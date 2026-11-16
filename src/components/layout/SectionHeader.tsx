import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  /** 오른쪽에 붙일 것 (예: "전체 보기" 링크) */
  action?: ReactNode
  className?: string
}

/** 묶음 위 제목 한 줄 (Layout/Section Header) */
function SectionHeader({ title, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className="text-body-strong">{title}</h2>
      {action}
    </div>
  )
}

export default SectionHeader
