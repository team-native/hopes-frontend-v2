import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface CodeInputProps {
  /** 지금까지 입력한 숫자 (예: "4821") */
  value: string
  onChange: (value: string) => void
  /** 칸 개수 (기본 6) */
  length?: number
  /** true면 빨간 테두리 */
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
  /** 화면 낭독기용 이름 */
  'aria-label'?: string
  'aria-describedby'?: string
}

/**
 * 인증번호 입력칸 (한 칸에 숫자 하나)
 * - 입력하면 다음 칸으로, 지우면 이전 칸으로 자동 이동
 * - 6자리 붙여넣기, 휴대폰 문자 자동완성 지원
 */
function CodeInput({
  value,
  onChange,
  length = 6,
  invalid = false,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel = '인증번호',
  'aria-describedby': ariaDescribedBy,
}: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const focusAt = (index: number) => {
    const target = inputsRef.current[Math.max(0, Math.min(length - 1, index))]
    target?.focus()
    target?.select()
  }

  /** index 칸부터 text를 채워 넣기 (붙여넣기 · 자동완성 대응) */
  const fillFrom = (index: number, text: string) => {
    const onlyDigits = text.replace(/\D/g, '')
    if (!onlyDigits) return
    const next = digits.slice()
    for (let i = 0; i < onlyDigits.length && index + i < length; i++) {
      next[index + i] = onlyDigits[i]
    }
    onChange(next.join('').slice(0, length))
    focusAt(index + onlyDigits.length)
  }

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1))
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index))
        focusAt(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (index: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    fillFrom(index, e.clipboardData.getData('text'))
  }

  return (
    <div className="grid grid-cols-6 gap-2.5" role="group" aria-label={ariaLabel} aria-describedby={ariaDescribedBy}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === Math.min(value.length, length - 1)}
          aria-label={`${ariaLabel} ${index + 1}번째 자리`}
          aria-invalid={invalid}
          onChange={(e) => fillFrom(index, e.target.value.slice(-length))}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          onFocus={(e) => e.target.select()}
          // 비어 있는 칸을 건너뛰고 뒤쪽을 누르면 첫 빈칸으로 이동
          onMouseDown={(e) => {
            if (index > value.length) {
              e.preventDefault()
              focusAt(value.length)
            }
          }}
          className={`h-[60px] w-full min-w-0 rounded-[14px] border bg-white text-center text-[28px] font-semibold outline-none transition disabled:cursor-not-allowed ${
            invalid ? 'border-error' : 'border-line focus:border-focus'
          }`}
        />
      ))}
    </div>
  )
}

export default CodeInput
