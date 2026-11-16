import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** lg: 가로 꽉 찬 큰 버튼(50) / sm: 글자만큼 작은 버튼(36) */
  size?: 'lg' | 'sm'
  /** primary: 파랑 / secondary: 흰색 + 테두리 / soft: 연파랑 배경 + 파란 글자 */
  variant?: 'primary' | 'secondary' | 'soft'
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

const SIZE_CLASS = {
  lg: 'h-[50px] w-full text-body-strong',
  sm: 'h-9 px-3.5 text-label-strong',
}

function variantClass(variant: NonNullable<ButtonProps['variant']>, inactive: boolean, loading: boolean) {
  if (variant === 'secondary') {
    return 'border border-border-default bg-bg-surface text-text-primary enabled:hover:bg-bg-canvas disabled:opacity-50'
  }
  if (variant === 'soft') {
    return 'bg-bg-brand-soft text-text-brand enabled:hover:brightness-[0.97] disabled:opacity-50'
  }
  // primary
  const color = inactive
    ? 'bg-bg-brand-disabled'
    : 'bg-bg-brand enabled:shadow-cloud-brand enabled:hover:bg-bg-brand-pressed enabled:active:scale-[0.99]'
  return `${color} text-text-on-brand ${loading ? 'disabled:bg-bg-brand-loading' : 'disabled:bg-bg-brand-disabled'}`
}

/** 버튼 (기본: 가로 꽉 찬 파란 버튼) */
function Button({
  children,
  size = 'lg',
  variant = 'primary',
  loading = false,
  loadingText,
  inactive = false,
  disabled,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={inactive || undefined}
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm transition disabled:cursor-not-allowed ${
        SIZE_CLASS[size]
      } ${variantClass(variant, inactive, loading)} ${className}`}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

export default Button
