import { Lock, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { RETRY_LATER } from '../../utils/error'
import Button from '../common/Button'
import FieldError from '../common/FieldError'
import Modal from '../common/Modal'
import Select from '../common/Select'

export interface WritePostValues {
  board: string
  title: string
  content: string
}

interface WritePostModalProps {
  open: boolean
  onClose: () => void
  /** 고를 수 있는 게시판 */
  boards: readonly string[]
  defaultBoard?: string
  /** 등록 (실패하면 throw → 팝업 안에 에러 문구가 뜨고 입력값은 그대로 남아요) */
  onSubmit: (values: WritePostValues) => Promise<void> | void
}

/**
 * 글쓰기 팝업 (Web/Modal) — 게시판 선택 · 제목 · 내용 · 취소/등록
 * 닫았다가 다시 열면 입력값이 처음 상태로 돌아가요.
 */
function WritePostModal({ open, onClose, boards, defaultBoard, onSubmit }: WritePostModalProps) {
  const titleId = useId()

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="w-[600px] p-xl">
      {/* Modal은 열려 있을 때만 안쪽을 그려서, 열 때마다 아래 폼이 새로 만들어져요 */}
      <WritePostForm
        titleId={titleId}
        boards={boards}
        defaultBoard={defaultBoard}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}

interface WritePostFormProps extends Omit<WritePostModalProps, 'open'> {
  titleId: string
}

function WritePostForm({ titleId, boards, defaultBoard, onClose, onSubmit }: WritePostFormProps) {
  const [board, setBoard] = useState(defaultBoard ?? boards[0] ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const canSubmit = board !== '' && title.trim() !== '' && content.trim() !== ''

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ board, title: title.trim(), content: content.trim() })
      onClose()
    } catch {
      // 실패하면 팝업을 닫지 않고 안내 → 등록됐는지 몰라 다시 누르는 일(중복 글)을 막아요
      setSubmitError(`글을 등록하지 못했어요. ${RETRY_LATER}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClass =
    'w-full rounded-sm border border-border-subtle bg-bg-surface px-4 text-label outline-none transition placeholder:text-text-tertiary focus:border-border-brand'

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-heading">
          글쓰기
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-1.5 flex size-8 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <Select
        className="mt-lg"
        variant="inline"
        label="게시판"
        placeholder="선택"
        options={boards}
        value={board}
        onChange={setBoard}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // 제목 칸에서 Enter를 누르면 바로 등록되지 않게 (한글 조합 중 Enter 포함)
          if (e.key === 'Enter') e.preventDefault()
        }}
        placeholder="제목"
        aria-label="제목"
        className={`mt-sm h-11 ${fieldClass}`}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력해 주세요"
        aria-label="내용"
        rows={8}
        className={`mt-sm block resize-none py-3 ${fieldClass}`}
      />

      <p className="mt-sm flex items-center gap-1.5 text-[11px] text-text-tertiary">
        <Lock className="size-3.5 text-icon-brand" strokeWidth={1.75} aria-hidden />
        작성자는 기수만 표시돼요. 이름·학번은 공개되지 않아요.
      </p>

      {submitError && <FieldError className="mt-sm">{submitError}</FieldError>}

      <div className="mt-lg flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button size="sm" type="submit" disabled={!canSubmit} loading={isSubmitting}>
          등록
        </Button>
      </div>
    </form>
  )
}

export default WritePostModal
