import { Lock, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import Button from '../common/Button'
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
  /** 등록 (실패하면 throw) */
  onSubmit: (values: WritePostValues) => Promise<void> | void
}

/** 글쓰기 팝업 (Web/Modal) — 게시판 선택 · 제목 · 내용 · 취소/등록 */
function WritePostModal({ open, onClose, boards, defaultBoard, onSubmit }: WritePostModalProps) {
  const titleId = useId()
  const [board, setBoard] = useState(defaultBoard ?? boards[0] ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = board !== '' && title.trim() !== '' && content.trim() !== ''

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit({ board, title: title.trim(), content: content.trim() })
      setTitle('')
      setContent('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClass =
    'w-full rounded-sm border border-border-subtle bg-bg-surface px-4 text-label outline-none transition placeholder:text-text-tertiary focus:border-border-brand'

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="w-[600px] p-xl">
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

        <div className="mt-lg flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" type="submit" disabled={!canSubmit} loading={isSubmitting}>
            등록
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default WritePostModal
