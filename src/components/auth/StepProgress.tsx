interface StepProgressProps {
  /** 맨 위 작은 제목 (예: "회원가입", "비밀번호 찾기") */
  title: string
  /** 현재 단계 (1부터 시작) */
  current: number
  /** 단계 이름 목록 */
  steps: readonly string[]
}

/**
 * "회원가입" + 진행바 + "1 / 3 · 이메일 인증"
 * - 단계가 바뀌면 진행바가 왼쪽에서 오른쪽으로 차오르고(뒤로 가면 거꾸로 줄어들고), 단계 글자가 살짝 올라오며 바뀌어요.
 * - 운영체제의 "동작 줄이기"를 켜면 styles/motion.css 규칙으로 모션 없이 바로 바뀌어요.
 */
function StepProgress({ title, current, steps }: StepProgressProps) {
  const total = steps.length

  return (
    <div>
      <p className="text-label font-medium text-text-secondary">{title}</p>

      <ol className="mt-4 flex gap-1.5" aria-label={`${title} ${total}단계 중 ${current}단계`}>
        {steps.map((name, index) => (
          <li
            key={name}
            className="h-1 flex-1 overflow-hidden rounded-full bg-border-subtle"
            aria-current={index + 1 === current ? 'step' : undefined}
          >
            {/* 칸 안의 파란 막대: 크기는 그대로 두고 가로 비율(scale-x)만 바꿔서 부드럽게 차올라요 */}
            <span
              className={`block h-full origin-left rounded-full bg-bg-brand transition-transform duration-500 ease-out-soft ${
                index < current ? 'scale-x-100' : 'scale-x-0'
              }`}
              aria-hidden
            />
            <span className="sr-only">{name}</span>
          </li>
        ))}
      </ol>

      {/* 화면 읽기 프로그램이 단계 변화를 읽도록 p는 그대로 두고, 안쪽 글자만 key로 새로 그려 모션을 다시 재생해요 */}
      <p className="mt-xs text-caption font-medium text-text-brand" aria-live="polite">
        <span key={current} className="inline-block animate-fade-up">
          {current} / {total} · {steps[current - 1]}
        </span>
      </p>
    </div>
  )
}

export default StepProgress
