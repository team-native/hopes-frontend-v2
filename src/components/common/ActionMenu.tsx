import { Ellipsis, type LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import useDismiss from '../../hooks/useDismiss'

export interface ActionMenuItem {
  label: string
  icon?: LucideIcon
  /** 빨간 글자 (삭제 등) */
  danger?: boolean
  /** 없으면 아직 만들지 않은 기능으로 보고 비활성 + "준비 중" 표시 */
  onSelect?: () => void
}

interface ActionMenuProps {
  /** ⋯ 버튼의 화면 낭독기용 이름 (예: "기숙사 와이파이 다들 잘 돼? 더보기") */
  label: string
  items: ActionMenuItem[]
}

/** ⋯ 버튼 + 아래로 펼쳐지는 메뉴. 바깥 클릭 · Esc로 닫혀요. */
function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useDismiss<HTMLDivElement>(open, () => setOpen(false))

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex size-7 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
      >
        <Ellipsis className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 min-w-36 rounded-md border border-border-default bg-bg-surface p-1 shadow-cloud-md"
        >
          {items.map(({ label: itemLabel, icon: Icon, danger, onSelect }) => (
            <li key={itemLabel} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={!onSelect}
                onClick={() => {
                  setOpen(false)
                  onSelect?.()
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-caption transition disabled:cursor-not-allowed disabled:text-text-tertiary disabled:hover:bg-transparent ${
                  danger ? 'text-text-danger hover:bg-bg-danger-soft' : 'text-text-primary hover:bg-bg-canvas'
                }`}
              >
                {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />}
                {itemLabel}
                {!onSelect && (
                  <span className="ml-auto rounded-full bg-bg-canvas px-1.5 py-0.5 text-[10px] text-text-secondary">
                    준비 중
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActionMenu
