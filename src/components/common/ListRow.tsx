import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import IconTile from './IconTile'

/** 목록 카드 틀 — 안에 ListRow를 넣어요 (줄 사이 구분선 포함) */
export function ListCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={`divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-surface px-3 shadow-cloud-sm ${className}`}
    >
      {children}
    </ul>
  )
}

interface ListRowProps {
  title: ReactNode
  /** 제목 아래 작은 설명 (한 줄로 잘려요) */
  description?: ReactNode
  /** 오른쪽 작은 글자 (예: "어제") */
  meta?: ReactNode
  /** 앞쪽 연파랑 아이콘 */
  icon?: LucideIcon
  /** 맨 오른쪽 요소 (삭제 버튼 · ⋯ 메뉴 · 배지 등) */
  trailing?: ReactNode
  /** 넘기면 제목 영역 전체가 버튼이 돼요 */
  onClick?: () => void
}

/** 목록 한 줄 — 아이콘 · 제목 · 설명 · 오른쪽 글자 · 버튼 (대화 기록, 활동 내역, 설정 목록) */
export function ListRow({ title, description, meta, icon, trailing, onClick }: ListRowProps) {
  const body = (
    <>
      <span className="block truncate text-label-strong">{title}</span>
      {description && <span className="mt-0.5 block truncate text-caption text-text-tertiary">{description}</span>}
    </>
  )

  return (
    <li className="flex min-h-14 min-w-0 items-center gap-2.5">
      {icon && <IconTile icon={icon} size="md" />}
      {onClick ? (
        <button type="button" onClick={onClick} className="min-w-0 flex-1 py-3 text-left">
          {body}
        </button>
      ) : (
        <div className="min-w-0 flex-1 py-3">{body}</div>
      )}
      {meta && <span className="hidden shrink-0 text-[11px] text-text-tertiary sm:inline">{meta}</span>}
      {trailing}
    </li>
  )
}
