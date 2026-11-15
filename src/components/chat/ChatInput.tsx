import { ArrowUp, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface ChatInputProps {
  /** 보내기 (빈 칸이면 호출 안 됨) */
  onSend: (message: string) => void
  /** 왼쪽 + 버튼 (첨부 등) */
  onAttach?: () => void
  placeholder?: string
  /** 답변을 기다리는 중 등 입력을 막을 때 */
  disabled?: boolean
  /** 아래 안내 문구 (없애려면 null) */
  notice?: string | null
  className?: string
}

/** 채팅 메시지 입력창 (최대 너비 720) */
function ChatInput({
  onSend,
  onAttach,
  placeholder = '선배에게 메시지 보내기',
  disabled = false,
  notice = '선배 답변은 실제 응답 데이터를 바탕으로 한 참고용이에요.',
  className = '',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const canSend = message.trim() !== '' && !disabled

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSend) return
    onSend(message.trim())
    setMessage('')
  }

  return (
    <div className={`w-full max-w-[720px] ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex h-14 items-center gap-2.5 rounded-full border border-border-subtle bg-bg-surface pr-2.5 pl-2.5 shadow-cloud-md transition focus-within:border-border-brand"
      >
        <button
          type="button"
          onClick={onAttach}
          disabled={disabled}
          aria-label="첨부"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-canvas text-icon-brand transition hover:bg-bg-brand-soft disabled:cursor-not-allowed"
        >
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            // 한글 조합 중 Enter로는 보내지 않음 (마지막 글자가 빠지거나 두 번 보내지는 것 방지)
            if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault()
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="메시지"
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="보내기"
          className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-bg-brand text-icon-on-brand shadow-cloud-brand transition enabled:hover:bg-bg-brand-pressed disabled:cursor-not-allowed"
        >
          <ArrowUp className="size-[18px]" strokeWidth={2.25} aria-hidden />
        </button>
      </form>

      {notice && <p className="mt-2.5 text-center text-caption text-text-tertiary">{notice}</p>}
    </div>
  )
}

export default ChatInput
