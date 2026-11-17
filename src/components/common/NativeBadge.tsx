import { useId } from 'react'

interface NativeBadgeProps {
  /** sm: 사이드바 로고 옆 / md: 로그인 화면 · 단독 */
  size?: 'sm' | 'md'
}

/** 팀 Native 로고 (기울어진 노란 알약 두 개: 진한 노랑 + 연한 노랑) */
function NativeLogo({ className }: { className?: string }) {
  // 배지가 한 화면에 여러 개 있어도 그라데이션 id가 겹치지 않게
  const id = useId()
  const deep = `${id}-deep`
  const soft = `${id}-soft`

  return (
    <svg viewBox="2 8 46.5 27.5" className={className} aria-hidden>
      <defs>
        <linearGradient id={deep} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor="#fdd967" />
          <stop offset="1" stopColor="#fccf3a" />
        </linearGradient>
        <linearGradient id={soft} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor="#fff0bd" />
          <stop offset="1" stopColor="#fee9a3" />
        </linearGradient>
      </defs>
      <rect
        x="8.75"
        y="6"
        width="13.5"
        height="31.5"
        rx="6.75"
        transform="rotate(44 15.5 21.75)"
        fill={`url(#${deep})`}
      />
      <rect
        x="28"
        y="6"
        width="13.5"
        height="31.5"
        rx="6.75"
        transform="rotate(44 34.75 21.75)"
        fill={`url(#${soft})`}
      />
    </svg>
  )
}

/** 팀 "Native" 배지 (Native 로고 + 글자) */
function NativeBadge({ size = 'md' }: NativeBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-border-subtle bg-bg-surface font-medium text-text-primary ${
        isSmall ? 'h-[18px] gap-1 px-1.5 text-[10px]' : 'h-[26px] gap-1.5 px-2.5 text-caption'
      }`}
    >
      <NativeLogo className={isSmall ? 'h-[9px] w-[15px]' : 'h-3 w-5'} />
      Native
    </span>
  )
}

export default NativeBadge
