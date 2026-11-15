import { useId, type ReactNode } from 'react'
import Button from './Button'
import Modal from './Modal'

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
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      className="w-[320px] px-6 pt-xl pb-lg text-center"
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
    </Modal>
  )
}

export default AlertDialog
