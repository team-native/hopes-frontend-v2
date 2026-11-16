import { ArrowUp, Plus } from 'lucide-react'
import type { FormEvent } from 'react'
import type { LocalAttachment } from '../../types/conversation'
import { ImageThumb, PdfCard } from '../attach/Attachments'
import FieldError from '../common/FieldError'
import { NoticeRow } from '../feedback/Feedback'

interface AttachmentComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** 왼쪽 + 버튼 (첨부 영역 열기) */
  onAttach: () => void
  attachments: LocalAttachment[]
  onRemoveAttachment: (id: string) => void
  /** 첨부를 받지 못했을 때 위쪽 에러 문구 (형식 · 용량 · 개수) */
  error?: string
  canSend: boolean
  placeholder?: string
}

/**
 * 첨부가 붙는 채팅 입력창 — 첨부 목록 · 확인 상태 · 안내 + 입력 + 보내기
 * 첨부가 필요 없으면 ChatInput을 써요.
 */
function AttachmentComposer({
  value,
  onChange,
  onSubmit,
  onAttach,
  attachments,
  onRemoveAttachment,
  error,
  canSend,
  placeholder = '추가 질문 입력...',
}: AttachmentComposerProps) {
  const imageErrors = attachments.filter((attachment) => attachment.format !== 'pdf' && attachment.error)
  const hasUnsupportedPreview = attachments.some((attachment) => attachment.previewUnsupported)
  // 첨부 · 에러가 없으면 ChatInput과 같은 알약 모양, 있으면 위에 목록이 붙는 카드 모양
  const expanded = attachments.length > 0 || Boolean(error)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSend) onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto w-full max-w-[720px] border border-border-subtle bg-bg-surface shadow-cloud-md transition focus-within:border-border-brand ${
        expanded ? 'rounded-lg p-3' : 'flex h-14 items-center rounded-full px-2.5'
      }`}
    >
      {error && <FieldError className="mb-3">{error}</FieldError>}
      {attachments.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <ComposerAttachment
                key={attachment.id}
                attachment={attachment}
                onRemove={() => onRemoveAttachment(attachment.id)}
              />
            ))}
          </div>
          <div className="mb-3 space-y-1.5">
            {imageErrors.map((attachment) => (
              <FieldError key={attachment.id} className="">
                {attachment.file.name} · {attachment.error}
              </FieldError>
            ))}
            <NoticeRow
              message={[
                hasUnsupportedPreview && '이 브라우저에서는 HEIC 미리보기를 지원하지 않아요. 파일은 그대로 첨부돼요.',
                '목업 단계라 첨부 파일은 서버로 업로드되지 않아요.',
              ]
                .filter(Boolean)
                .join('\n')}
            />
          </div>
        </>
      )}
      <div className="flex w-full items-center gap-2.5">
        <button
          type="button"
          aria-label="자료 첨부"
          onClick={onAttach}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-canvas text-icon-brand transition hover:bg-bg-brand-soft"
        >
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // 한글 조합 중 Enter로는 보내지 않음
            if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
          }}
          placeholder={attachments.length > 0 ? '자료에 대해 질문하기' : placeholder}
          aria-label="메시지"
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-text-tertiary"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="보내기"
          className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-bg-brand text-icon-on-brand shadow-cloud-brand transition enabled:hover:bg-bg-brand-pressed disabled:cursor-not-allowed disabled:bg-bg-brand-disabled disabled:shadow-none"
        >
          <ArrowUp className="size-[18px]" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </form>
  )
}

/** 입력창 위 첨부 하나 — 이미지는 ImageThumb, PDF는 PdfCard에 로컬 확인 상태를 덧붙여요 */
function ComposerAttachment({ attachment, onRemove }: { attachment: LocalAttachment; onRemove: () => void }) {
  const { file, format, status, previewUrl, previewUnsupported, pageCount, error } = attachment

  if (format === 'pdf') {
    const description =
      error ?? (status === 'processing' ? '파일 확인 중…' : `PDF${pageCount ? ` · ${pageCount}쪽` : ''} · 첨부 준비됨`)
    return (
      <div className="w-[220px] max-w-full">
        <PdfCard name={file.name} description={description} invalid={Boolean(error)} onRemove={onRemove} />
      </div>
    )
  }

  const statusLabel =
    status === 'processing' ? '확인 중' : status === 'error' ? '오류' : previewUnsupported ? 'HEIC' : undefined
  return (
    <div className={`relative ${status === 'processing' ? 'animate-pulse' : ''}`} title={error ?? file.name}>
      <ImageThumb src={previewUrl} alt={file.name} onRemove={onRemove} />
      {statusLabel && (
        <span
          className={`pointer-events-none absolute inset-x-1 bottom-1 rounded-[4px] bg-bg-surface/90 text-center text-[9px] font-medium ${
            status === 'error' ? 'text-text-danger' : 'text-text-secondary'
          }`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  )
}

export default AttachmentComposer
