import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'
import FieldError from './FieldError'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 위쪽 라벨 (없으면 생략) */
  label?: string
  errorMessage?: ReactNode
}

/** 여러 줄 입력 (Form/Text Area). 선택하면 파란 테두리 */
function TextArea({ label, errorMessage, id, className = '', rows = 4, ...rest }: TextAreaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-label font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? errorId : undefined}
        {...rest}
        className={`block w-full resize-none rounded-sm border bg-bg-surface px-4 py-3 text-label outline-none transition placeholder:text-text-tertiary ${
          errorMessage ? 'border-border-danger' : 'border-border-default focus:border-border-brand'
        }`}
      />
      {errorMessage && <FieldError id={errorId}>{errorMessage}</FieldError>}
    </div>
  )
}

export default TextArea
