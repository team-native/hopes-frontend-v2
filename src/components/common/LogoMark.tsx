import logo from '../../assets/logo.svg'

interface LogoMarkProps {
  /** 박스 크기(px). 사이드바 40, 로그인 화면 48 */
  size?: 40 | 48
}

/** 흰 박스 안의 hopes "h" 로고 */
function LogoMark({ size = 48 }: LogoMarkProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-bg-surface shadow-cloud-sm ${
        size === 40 ? 'size-10' : 'size-12'
      }`}
    >
      <img src={logo} alt="hopes" className={size === 40 ? 'h-5 w-auto' : 'h-6 w-auto'} />
    </span>
  )
}

export default LogoMark
