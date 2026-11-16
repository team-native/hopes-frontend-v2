interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 화면 낭독기용 이름 (예: "새 답변 알림") */
  label: string
  disabled?: boolean
}

/** 켜기 · 끄기 스위치 */
function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        // 꺼짐 상태에 맞는 배경 토큰이 없어 회색 테두리 토큰을 배경으로 사용 (디자이너 확인 필요)
        checked ? 'bg-bg-brand' : 'bg-border-default'
      }`}
    >
      <span
        className={`size-5 rounded-full bg-bg-surface shadow-cloud-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default Switch
