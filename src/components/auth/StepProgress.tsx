interface StepProgressProps {
  /** 맨 위 작은 제목 (예: "회원가입", "비밀번호 찾기") */
  title: string
  /** 현재 단계 (1부터 시작) */
  current: number
  /** 단계 이름 목록 */
  steps: readonly string[]
}

/** "회원가입" + 진행바 + "1 / 3 · 이메일 인증" */
function StepProgress({ title, current, steps }: StepProgressProps) {
  const total = steps.length

  return (
    <div>
      <p className="text-label font-medium text-text-secondary">{title}</p>

      <ol className="mt-4 flex gap-1.5" aria-label={`${title} ${total}단계 중 ${current}단계`}>
        {steps.map((name, index) => (
          <li
            key={name}
            className={`h-1 flex-1 rounded-full transition-colors ${index < current ? 'bg-bg-brand' : 'bg-border-subtle'}`}
            aria-current={index + 1 === current ? 'step' : undefined}
          >
            <span className="sr-only">{name}</span>
          </li>
        ))}
      </ol>

      <p className="mt-xs text-caption font-medium text-text-brand">
        {current} / {total} · {steps[current - 1]}
      </p>
    </div>
  )
}

export default StepProgress
