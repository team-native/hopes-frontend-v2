import { useId } from 'react'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { NoticeRow } from '../feedback/Feedback'

const REPORT_REASONS = ['욕설·비방', '도배·광고', '개인정보 노출', '부적절한 내용', '기타'] as const

interface ReportDialogProps {
  open: boolean
  /** 신고 대상 (제목에 표시) */
  target: '게시글' | '댓글'
  reason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSubmit: () => void
  /** 신고 API 연동 전 안내 문구 (없애려면 null) */
  notice?: string | null
}

/** 신고 사유 선택 팝업 */
function ReportDialog({
  open,
  target,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
  notice = '신고 기능은 준비 중이에요. 지금은 화면 시연만 되고 실제로 접수되지 않아요.',
}: ReportDialogProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="w-[360px] p-xl">
      <h2 id={titleId} className="text-heading">
        {target} 신고
      </h2>
      <p className="mt-xs text-caption text-text-secondary">신고한 사람의 정보는 공개되지 않아요.</p>
      {notice && (
        <div className="mt-sm">
          <NoticeRow message={notice} />
        </div>
      )}
      <fieldset className="mt-md">
        <legend className="sr-only">신고 사유</legend>
        {REPORT_REASONS.map((item) => (
          <label
            key={item}
            className="flex h-11 cursor-pointer items-center justify-between border-b border-border-subtle text-label last:border-0"
          >
            {item}
            <input
              type="radio"
              name="report-reason"
              value={item}
              checked={reason === item}
              onChange={() => onReasonChange(item)}
              className="size-4 accent-bg-brand"
            />
          </label>
        ))}
      </fieldset>
      <div className="mt-lg flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button size="sm" onClick={onSubmit}>
          신고하기
        </Button>
      </div>
    </Modal>
  )
}

export default ReportDialog
