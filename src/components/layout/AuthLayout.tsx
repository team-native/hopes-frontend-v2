import type { ReactNode } from 'react'
import logo from '../../assets/logo.svg'

interface AuthLayoutProps {
  children: ReactNode
}

/** 로그인 · 회원가입 · 비밀번호 찾기 공통 레이아웃 (왼쪽 소개 + 오른쪽 폼) */
function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative flex min-h-screen flex-col overflow-hidden px-6 py-10 sm:px-12 lg:px-[68px] lg:py-14">
        <Brand />

        <div className="relative z-10 grid flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-8">
          <Hero />
          <div className="w-full max-w-[405px] lg:justify-self-center">{children}</div>
        </div>

        <p className="relative z-10 text-xs text-sub/80">© hopes · 광주소프트웨어마이스터고</p>

        <Clouds />
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl border border-line bg-white shadow-sm">
        <img src={logo} alt="hopes" className="h-5 w-auto" />
      </div>
      <div>
        <p className="text-base leading-tight font-semibold">hopes</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-sub">광주소프트웨어마이스터고</span>
          <span className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium">
            <span className="flex gap-[2px]" aria-hidden>
              <span className="h-2 w-[3px] skew-x-[-20deg] rounded-sm bg-[#f5c542]" />
              <span className="h-2 w-[3px] skew-x-[-20deg] rounded-sm bg-[#f5c542]" />
            </span>
            Native
          </span>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section>
      <h1 className="text-[28px] leading-snug font-bold tracking-tight sm:text-[32px]">
        <span className="text-primary">선배</span>에게 묻는
        <br />
        <span className="text-primary">가장 솔직한</span> 학교 이야기
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-sub">
        재학생·신입생·입학 희망자를 위한 선배 챗봇.
        <br />
        기숙사, 전공, 취업 질문에 선배 경험으로 답해요.
      </p>
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
