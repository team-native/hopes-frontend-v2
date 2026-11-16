import { useId, type ReactNode } from 'react'
import Button from './Button'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** 확인 버튼 글자 (기본: 확인) */
  confirmText?: string
  /** 취소 버튼 글자 (기본: 취소) */
  cancelText?: string
  /** danger: 삭제 · 로그아웃처럼 되돌리기 어려운 동작 (빨간 확인 버튼) */
  tone?: 'default' | 'danger'
  onConfirm: () => void
  /** 취소 버튼, Esc 키로 닫힐 때 호출 */
  onCancel: () => void
}

/** 취소 · 확인 버튼 두 개짜리 확인 팝업 (AlertDialog의 두 버튼 버전) */
function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      className="w-[320px] px-6 pt-xl pb-lg text-center"
    >
      <h2 id={titleId} className="text-heading">
        {title}
      </h2>
      {description && (
        <div id={descriptionId} className="mt-xs text-label text-text-secondary">
          {description}
        </div>
      )}
      <div className="mt-xl grid grid-cols-2 gap-2">
        <Button variant="secondary" className="h-11!" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          className={`h-11! ${tone === 'danger' ? 'bg-bg-danger-soft! text-text-danger! shadow-none!' : ''}`}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
