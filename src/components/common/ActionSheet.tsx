import { useId } from 'react'
import type { ActionMenuItem } from './ActionMenu'
import Badge from './Badge'
import Modal from './Modal'

interface ActionSheetProps {
  open: boolean
  /** 화면 낭독기용 팝업 이름 (예: "게시글 메뉴") */
  title: string
  items: ActionMenuItem[]
  onClose: () => void
}

/**
 * 가운데 팝업으로 뜨는 메뉴 목록 (Esc · 바깥 클릭으로 닫힘)
 * 버튼 위치에 붙는 메뉴가 필요하면 ActionMenu를 써요.
 */
function ActionSheet({ open, title, items, onClose }: ActionSheetProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} closeOnBackdrop className="w-[300px] p-md">
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <ul>
        {items.map(({ label, icon: Icon, danger, onSelect }) => (
          <li key={label}>
            <button
              type="button"
              disabled={!onSelect}
              onClick={onSelect}
              className={`flex h-11 w-full items-center gap-2.5 rounded-sm px-3 text-label transition disabled:cursor-not-allowed disabled:text-text-tertiary ${
                danger ? 'text-text-danger hover:bg-bg-danger-soft' : 'hover:bg-bg-canvas'
              }`}
            >
              {Icon && (
                <Icon
                  className={`size-4 ${danger ? 'text-icon-danger' : 'text-icon-muted'}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              {label}
              {!onSelect && <Badge className="ml-auto">준비 중</Badge>}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default ActionSheet
