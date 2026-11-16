import type { ReactNode } from 'react'

interface FieldErrorProps {
  id?: string
  children: ReactNode
  className?: string
}

/** 입력칸 아래 빨간 에러 문구 (ⓘ 아이콘 + 글자) */
function FieldError({ id, children, className = 'mt-2' }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className={`flex items-center gap-1 text-caption text-text-danger ${className}`}>
      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.8v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.9" fill="currentColor" />
      </svg>
      {children}
    </p>
  )
}

export default FieldError
