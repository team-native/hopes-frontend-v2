import type { ReactNode } from 'react'
import cloudsImage from '../../assets/auth/clouds.webp'
import LogoMark from '../common/LogoMark'
import NativeBadge from '../common/NativeBadge'

interface AuthLayoutProps {
  children: ReactNode
  /** 왼쪽 큰 제목 아래 설명 문구 (페이지마다 다르면 넘겨주세요) */
  description?: ReactNode
}

const DEFAULT_DESCRIPTION = (
  <>
    재학생·신입생·입학 희망자를 위한 선배 챗봇.
    <br />
    기숙사, 전공, 취업 질문에 선배 경험으로 답해요.
  </>
)

const COPYRIGHT = '© hopes · 광주소프트웨어마이스터고'

/**
 * 로그인 · 회원가입 · 비밀번호 찾기 공통 레이아웃
 * 시안 기준 1440 × 900: 왼쪽 절반(로고 · 소개 · 카피라이트) + 오른쪽 절반(폼, 세로 가운데)
 */
function AuthLayout({ children, description = DEFAULT_DESCRIPTION }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-surface lg:grid lg:grid-cols-2">
      {/* 왼쪽 */}
      <div className="relative z-10 flex flex-col px-6 pt-10 sm:px-12 lg:min-h-screen lg:px-20 lg:py-16">
        <Brand />
        <div className="flex flex-1 items-center py-12 lg:py-0">
          <Hero description={description} />
        </div>
        <p className="hidden text-caption text-text-tertiary lg:block">{COPYRIGHT}</p>
      </div>

      {/* 오른쪽 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pb-10 sm:px-12 lg:py-5xl lg:pr-6 lg:pl-0">
        <div className="w-full max-w-[480px]">{children}</div>
        <p className="mt-16 self-start text-caption text-text-tertiary lg:hidden">{COPYRIGHT}</p>
      </div>

      <Clouds />
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={48} />
      <div>
        <p className="text-heading font-medium">hopes</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-caption text-text-secondary">광주소프트웨어마이스터고</span>
          <NativeBadge />
        </div>
      </div>
    </div>
  )
}

function Hero({ description }: { description: ReactNode }) {
  return (
    <section>
      <h1 className="text-title tracking-tight sm:text-display">
        <span className="text-text-brand">선배</span>에게 묻는
        <br />
        <span className="text-text-brand">가장 솔직한</span> 학교 이야기
      </h1>
      <p className="mt-5 text-body text-text-secondary">{description}</p>
    </section>
  )
}

/**
 * 오른쪽 아래 구름 장식 (디자인에서 받은 투명 배경 이미지를 그대로 사용)
 * 모바일에서는 폼 아래 글씨 뒤까지 올라오지 않게 조금 작게 보여 줘요.
 */
function Clouds() {
  return (
    <img
      src={cloudsImage}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute right-0 bottom-0 w-[600px] max-w-[70vw] select-none lg:max-w-none"
    />
  )
}

export default AuthLayout
