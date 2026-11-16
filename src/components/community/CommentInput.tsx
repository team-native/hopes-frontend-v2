import { useState, type FormEvent, type Ref } from 'react'
import Button from '../common/Button'

interface CommentInputProps {
  /** 등록 (빈 칸이면 호출 안 됨) */
  onSubmit: (content: string) => void
  placeholder?: string
  /** 댓글 칩을 눌렀을 때 입력칸으로 포커스를 옮길 때 사용 */
  inputRef?: Ref<HTMLInputElement>
}

/** 댓글 한 줄 입력 + 등록 버튼 (게시글 상세 아래) */
function CommentInput({ onSubmit, placeholder = '댓글 달기', inputRef }: CommentInputProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = content.trim()
    if (!text) return
    onSubmit(text)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          // 한글 조합 중 Enter로는 등록하지 않음
          if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 min-w-0 flex-1 rounded-full border border-border-default bg-bg-surface px-4 text-label transition outline-none placeholder:text-text-tertiary focus:border-border-brand"
      />
      <Button size="sm" type="submit" className="h-11" disabled={!content.trim()}>
        등록
      </Button>
    </form>
  )
}

export default CommentInput
