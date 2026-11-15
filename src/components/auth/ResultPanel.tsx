import type { ReactNode } from 'react'
import Button from '../common/Button'

interface ResultPanelProps {
  /** 연파랑 원 안 아이콘 */
  icon: 'check' | 'lock'
  title: ReactNode
  description: ReactNode
  buttonText: string
  onButtonClick: () => void
}

const ICONS = {
  check: <path d="M7 16.5 13 22.5 25 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />,
  lock: (
    <>
      <rect x="8.5" y="14" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M11.5 14v-3a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
}

/** 가입 완료 · 비밀번호 변경 완료처럼 가운데 정렬된 결과 화면 */
function ResultPanel({ icon, title, description, buttonText, onButtonClick }: ResultPanelProps) {
  return (
    <section className="flex flex-col items-center text-center" aria-live="polite">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden>
          {ICONS[icon]}
        </svg>
      </div>

      <h2 className="mt-4 text-[25px] leading-8 font-medium">{title}</h2>
      <p className="mt-[19px] text-[15px] leading-5 text-sub">{description}</p>

      <Button className="mt-[18px]" onClick={onButtonClick}>
        {buttonText}
      </Button>
    </section>
  )
}

export default ResultPanel
