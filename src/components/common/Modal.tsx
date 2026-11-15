import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  /** 닫기 버튼, Esc 키, (closeOnBackdrop이면) 바깥 클릭으로 닫힐 때 호출 */
  onClose: () => void
  /** 제목 요소의 id (화면 낭독기가 팝업 이름으로 읽어요) */
  labelledBy?: string
  describedBy?: string
  /** 바깥(어두운 배경)을 누르면 닫을지 */
  closeOnBackdrop?: boolean
  /** 팝업 상자 크기 · 여백 (예: "w-[600px] p-xl") */
  className?: string
  children: ReactNode
}

/**
 * 팝업 공통 틀 (가운데 + 어두운 배경)
 * 브라우저 기본 <dialog>를 써서 Esc 닫기, 뒤 화면 막기, Tab 포커스 가두기가 자동이에요.
 */
function Modal({ open, onClose, labelledBy, describedBy, closeOnBackdrop = false, className = '', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
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
      onClose={onClose}
      onClick={(e) => {
        // 상자 바깥(배경)을 눌렀을 때만
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`m-auto max-w-[calc(100vw-32px)] rounded-xl bg-bg-surface text-text-primary shadow-cloud-md outline-none backdrop:bg-bg-inverse/36 ${className}`}
    >
      {children}
    </dialog>
  )
}

export default Modal
