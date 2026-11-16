interface AvatarProps {
  /** 이름 (첫 글자를 보여 줘요) */
  name: string
  /** sm 32 (사이드바) / md 40 (프로필 카드) */
  size?: 'sm' | 'md'
}

/** 이름 첫 글자가 들어간 연파랑 원 (Profile/Avatar) */
function Avatar({ name, size = 'sm' }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-bg-brand-soft font-semibold text-text-brand ${
        size === 'sm' ? 'size-8 text-label' : 'size-10 text-body'
      }`}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  )
}

export default Avatar
