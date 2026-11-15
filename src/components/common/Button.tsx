import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** true면 로딩 색 + loadingText 표시, 클릭 막힘 */
  loading?: boolean
  /** 로딩 중 글자 (예: "로그인 중...") */
  loadingText?: ReactNode
  /**
   * true면 비활성처럼 연한 색으로 보이지만 클릭은 됨
   * (아직 다 안 채운 폼에서 눌렀을 때 빠진 항목을 알려 줄 때 사용)
   */
  inactive?: boolean
}

/** 메인 파란 버튼 (가로 꽉 참) */
function Button({
  children,
  loading = false,
  loadingText,
  inactive = false,
  disabled,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const color = inactive
    ? 'bg-bg-brand-disabled'
    : 'bg-bg-brand enabled:shadow-cloud-brand enabled:hover:bg-bg-brand-pressed enabled:active:scale-[0.99]'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={inactive || undefined}
      {...rest}
      className={`h-[50px] w-full rounded-sm text-body-strong text-text-on-brand transition disabled:cursor-not-allowed ${color} ${
        loading ? 'disabled:bg-bg-brand-loading' : 'disabled:bg-bg-brand-disabled'
      } ${className}`}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

export default Button
