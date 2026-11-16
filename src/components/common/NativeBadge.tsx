interface NativeBadgeProps {
  /** sm: 사이드바 로고 옆 / md: 로그인 화면 · 단독 */
  size?: 'sm' | 'md'
}

/** 팀 "Native" 배지 (노란 빗금 두 개 + 글자) */
function NativeBadge({ size = 'md' }: NativeBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-border-subtle bg-bg-surface font-medium text-text-primary ${
        isSmall ? 'h-[18px] gap-1 px-1.5 text-[10px]' : 'h-[26px] gap-1.5 px-2.5 text-caption'
      }`}
    >
      <span className="flex gap-[2px]" aria-hidden>
        <span className={`${isSmall ? 'h-2' : 'h-2.5'} w-[3px] skew-x-[-20deg] rounded-full bg-[#ecce5d]`} />
        <span className={`${isSmall ? 'h-2' : 'h-2.5'} w-[3px] skew-x-[-20deg] rounded-full bg-[#ecce5d]`} />
      </span>
      Native
    </span>
  )
}

export default NativeBadge
