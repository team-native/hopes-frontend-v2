import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'

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
    <div className="relative min-h-screen overflow-hidden bg-white lg:grid lg:grid-cols-2">
      {/* 왼쪽 */}
      <div className="relative z-10 flex flex-col px-6 pt-10 sm:px-12 lg:min-h-screen lg:px-20 lg:py-16">
        <Brand />
        <div className="flex flex-1 items-center py-12 lg:py-0">
          <Hero description={description} />
        </div>
        <p className="hidden text-sm text-sub/80 lg:block">{COPYRIGHT}</p>
      </div>

      {/* 오른쪽 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pb-10 sm:px-12 lg:pt-[68px] lg:pr-6 lg:pb-[60px] lg:pl-0">
        <div className="w-full max-w-[480px]">{children}</div>
        <p className="mt-16 self-start text-sm text-sub/80 lg:hidden">{COPYRIGHT}</p>
      </div>

      <Clouds />
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-12 items-center justify-center rounded-[14px] border border-line bg-white shadow-sm">
        <img src={logo} alt="hopes" className="h-6 w-auto" />
      </div>
      <div>
        <p className="text-xl leading-6 font-medium">hopes</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm text-sub">광주소프트웨어마이스터고</span>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-0.5 text-sm font-medium">
            <span className="flex gap-[2px]" aria-hidden>
              <span className="h-2.5 w-[3px] skew-x-[-20deg] rounded-sm bg-[#f5c542]" />
              <span className="h-2.5 w-[3px] skew-x-[-20deg] rounded-sm bg-[#f5c542]" />
            </span>
            Native
          </span>
        </div>
      </div>
    </div>
  )
}

function Hero({ description }: { description: ReactNode }) {
  return (
    <section>
      <h1 className="text-[32px] leading-tight font-bold tracking-tight sm:text-[42px] sm:leading-[52px]">
        <span className="text-primary">선배</span>에게 묻는
        <br />
        <span className="text-primary">가장 솔직한</span> 학교 이야기
      </h1>
      <p className="mt-5 text-base leading-relaxed text-sub sm:text-[17px] sm:leading-[26px]">{description}</p>
    </section>
  )
}

/** 오른쪽 아래 구름 장식 */
function Clouds() {
  return (
    <div className="pointer-events-none absolute right-0 bottom-0 h-[220px] w-[460px] opacity-80 blur-[2px]" aria-hidden>
      <div className="absolute -right-10 -bottom-24 size-[300px] rounded-full bg-gradient-to-b from-[#f1f4fd] to-[#e3e9fb]" />
      <div className="absolute right-24 -bottom-28 size-[260px] rounded-full bg-gradient-to-b from-[#f4f6fd] to-[#e8edfb]" />
      <div className="absolute right-60 -bottom-36 size-[240px] rounded-full bg-gradient-to-b from-[#f6f8fe] to-[#ecf0fc]" />
      <div className="absolute -right-6 -bottom-16 size-[150px] rounded-full bg-[#dfe6fb]" />
    </div>
  )
}

export default AuthLayout
