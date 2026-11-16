interface PasswordToggleProps {
  visible: boolean
  onToggle: () => void
}

/** 비밀번호 보기/숨기기 눈 아이콘 버튼 (TextField의 rightSlot에 넣어서 사용) */
function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
      aria-pressed={visible}
      className="flex size-8 items-center justify-center rounded-sm text-icon-muted transition hover:text-icon-default"
    >
      <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
        <path
          d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
        {!visible && <path d="M3.5 3.5l13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
      </svg>
    </button>
  )
}

export default PasswordToggle
