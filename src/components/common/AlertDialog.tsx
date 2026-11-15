import { useEffect, useId, useRef, type ReactNode } from 'react'
import Button from './Button'

interface AlertDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** 버튼 글자 (기본: 확인) */
  confirmText?: string
  /** 확인 버튼, Esc 키로 닫힐 때 호출 */
  onClose: () => void
}

/** 확인 버튼 하나짜리 알림 팝업 (가운데 + 어두운 배경) */
function AlertDialog({ open, title, description, confirmText = '확인', onClose }: AlertDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // 열릴 때 버튼 대신 팝업 자체에 포커스 → 시안처럼 버튼 테두리 없이 열림 (Tab 누르면 버튼으로 이동)
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="m-auto w-[320px] max-w-[calc(100vw-32px)] rounded-[28px] bg-white px-6 pt-[26px] pb-[19px] text-center text-ink shadow-xl outline-none backdrop:bg-toast/36"
    >
      <h2 id={titleId} className="text-[19px] leading-7 font-semibold">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-[7px] text-[15px] leading-[22px] text-sub">
          {description}
        </p>
      )}
      <Button className="mt-[23px] h-[52px]!" onClick={onClose}>
        {confirmText}
      </Button>
    </dialog>
  )
}

export default AlertDialog
