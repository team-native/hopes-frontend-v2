import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import FieldError from './FieldError'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 입력창 위 라벨 */
  label: string
  /** true면 빨간 테두리 */
  invalid?: boolean
  /** 입력창 아래 에러 문구 (있으면 invalid 처리) */
  errorMessage?: ReactNode
  /** 입력창 안 오른쪽에 넣을 요소 (예: 비밀번호 보기 버튼) */
  rightSlot?: ReactNode
}

/** 라벨 + 입력창 + 에러 문구 */
function TextField({ label, invalid, errorMessage, rightSlot, id, className = '', ...inputProps }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const isInvalid = invalid || Boolean(errorMessage)

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-label font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={isInvalid}
          aria-describedby={errorMessage ? errorId : undefined}
          {...inputProps}
          className={`h-[52px] w-full rounded-sm border bg-bg-surface px-4 text-body outline-none transition placeholder:text-text-tertiary ${
            rightSlot ? 'pr-12' : ''
          } ${isInvalid ? 'border-border-danger' : 'border-border-default focus:border-border-brand'}`}
        />
        {rightSlot && <div className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</div>}
      </div>
      {errorMessage && <FieldError id={errorId}>{errorMessage}</FieldError>}
    </div>
  )
}

export default TextField
