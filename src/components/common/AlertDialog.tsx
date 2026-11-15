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
      className="m-auto w-[320px] max-w-[calc(100vw-32px)] rounded-xl bg-bg-surface px-6 pt-xl pb-lg text-center text-text-primary shadow-cloud-md outline-none backdrop:bg-bg-inverse/36"
    >
      <h2 id={titleId} className="text-heading">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-xs text-label text-text-secondary">
          {description}
        </p>
      )}
      <Button className="mt-xl h-[52px]!" onClick={onClose}>
        {confirmText}
      </Button>
    </dialog>
  )
}

export default AlertDialog
