import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  /**
   * 사용자가 닫으려고 할 때만 호출 (Esc 키, (closeOnBackdrop이면) 바깥 클릭)
   * 부모가 open을 false로 바꿔서 닫힐 때는 호출하지 않아요.
   */
  onClose: () => void
  /** 제목 요소의 id (화면 낭독기가 팝업 이름으로 읽어요) */
  labelledBy?: string
  describedBy?: string
  /** 바깥(어두운 배경)을 누르면 닫을지 */
  closeOnBackdrop?: boolean
  /** 팝업 상자 크기 · 여백 (예: "w-[600px] p-xl") */
  className?: string
  /** 팝업 내용. 닫혀 있을 때는 그리지 않아서, 다시 열면 입력값 등이 처음 상태로 돌아가요 */
  children: ReactNode
}

/**
 * 팝업 공통 틀 (가운데 + 어두운 배경)
 * 브라우저 기본 <dialog>를 써서 뒤 화면 막기, Tab 포커스 가두기가 자동이에요.
 * 열고 닫는 건 항상 부모의 open 값으로만 해요 (Esc도 onClose → 부모가 open=false).
 */
function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  closeOnBackdrop = false,
  className = '',
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  // 가장 최근 open 값 (close 이벤트에서 "부모가 닫은 건지" 구분할 때 사용)
  const openRef = useRef(open)

  useEffect(() => {
    openRef.current = open
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // 열릴 때 첫 버튼 대신 팝업 자체에 포커스 → 버튼 포커스 테두리 없이 열림
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      // Esc: 브라우저가 바로 닫지 않게 막고, 부모에게 알려서 open으로 닫히게 함
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // 브라우저가 직접 닫은 경우(Esc를 연달아 누르면 막아도 닫힐 때가 있음)에만 알림.
      // 부모가 open=false로 닫은 경우엔 openRef가 이미 false라 다시 부르지 않아요.
      onClose={() => {
        if (openRef.current) onClose()
      }}
      onClick={(e) => {
        // 상자 바깥(배경)을 눌렀을 때만
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`m-auto max-w-[calc(100vw-32px)] animate-pop-in rounded-xl bg-bg-surface text-text-primary shadow-cloud-md outline-none backdrop:bg-bg-inverse/36 ${className}`}
    >
      {open && children}
    </dialog>
  )
}

export default Modal
