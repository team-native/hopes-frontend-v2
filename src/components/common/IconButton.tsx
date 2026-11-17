import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  /** 화면 낭독기용 이름 (예: "뒤로 가기") — 아이콘만 있는 버튼이라 꼭 필요해요 */
  label: string
  /** ghost: 배경 없음 (Nav/Icon Button) / boxed: 흰 원 + 그림자 (Nav/Icon Button Boxed) */
  variant?: 'ghost' | 'boxed'
  /** 오른쪽 위 빨간 점 (새 알림 등) */
  dot?: boolean
}

/** 아이콘만 있는 동그란 버튼 */
function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  dot = false,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      {...rest}
      className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full text-icon-default transition duration-150 hover:bg-bg-canvas enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === 'boxed' ? 'border border-border-subtle bg-bg-surface shadow-cloud-sm' : ''
      } ${className}`}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      {dot && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-icon-danger" aria-hidden />}
    </button>
  )
}

export default IconButton
