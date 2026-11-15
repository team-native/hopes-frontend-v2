import type { InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode
}

/** 파란 네모 체크박스 + 글자 (글자를 눌러도 체크됨) */
function Checkbox({ children, className = '', ...inputProps }: CheckboxProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 ${className}`}>
      <input type="checkbox" className="peer sr-only" {...inputProps} />
      <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-border-default bg-bg-surface text-text-on-brand transition peer-checked:border-transparent peer-checked:bg-bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-border-brand">
        <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
          <path
            d="M2.5 6.2 5 8.5l4.5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </label>
  )
}

export default Checkbox
