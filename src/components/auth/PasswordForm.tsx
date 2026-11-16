import { useState, type FormEvent, type ReactNode } from 'react'
import Button from '../common/Button'
import PasswordToggle from '../common/PasswordToggle'
import TextField from '../common/TextField'
import { RETRY_LATER } from '../../utils/error'
import { PASSWORD_RULES, isValidPassword } from '../../utils/password'

interface PasswordFormProps {
  /** 제목 (예: <><span className="text-text-brand">새 비밀번호</span>를 만들어 주세요</>) */
  heading: ReactNode
  /** 제목 아래 줄 (설명이나 "인증 완료" 표시) */
  description?: ReactNode
  /** 라벨 앞에 붙는 말 (예: "새 " → "새 비밀번호", "새 비밀번호 확인") */
  labelPrefix?: string
  /** 버튼 글자 (예: "다음", "비밀번호 변경") */
  submitText: string
  /**
   * 조건을 만족하고 확인까지 일치하면 호출
   * 서버 에러가 있으면 비밀번호 칸 아래에 띄울 문구를 돌려주세요 (없으면 undefined)
   */
  onSubmit: (password: string) => Promise<string | undefined> | void
  /** 맨 아래 링크 */
  footer: ReactNode
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0" fill="none" aria-hidden>
      <path
        d="M2.5 6.2 5 8.5l4.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0" fill="none" aria-hidden>
      <path d="M3 3l6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 비밀번호 + 비밀번호 확인 입력 (회원가입 · 비밀번호 재설정 공통)
 * - 조건은 입력하는 동안 실시간으로 파랑 ✓ 표시
 * - 칸에서 벗어났을 때(blur) 안 맞으면 빨간 테두리 + ✕ 표시
 */
function PasswordForm({ heading, description, labelPrefix = '', submitText, onSubmit, footer }: PasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPasswordValid = isValidPassword(password)
  const showRuleError = passwordTouched && password !== '' && !isPasswordValid
  const passwordError = serverError || (showRuleError ? '비밀번호 조건을 모두 맞춰 주세요.' : '')

  const isMatch = confirm !== '' && confirm === password
  const showConfirmError = confirmTouched && confirm !== '' && !isMatch

  const canSubmit = isPasswordValid && isMatch && !serverError

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    try {
      const error = await onSubmit(password)
      if (error) setServerError(error)
    } catch {
      // onSubmit이 문구를 돌려주지 않고 실패한 경우에도 그냥 멈추지 않도록 기본 안내
      setServerError(`요청을 처리하지 못했어요. ${RETRY_LATER}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordId = `${labelPrefix ? 'new-' : ''}password`

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="mt-md text-title">{heading}</h2>
      {description}

      <TextField
        className="mt-md"
        id={passwordId}
        label={`${labelPrefix}비밀번호`}
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder={`${labelPrefix}비밀번호 입력`}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setServerError('')
        }}
        onBlur={() => setPasswordTouched(true)}
        errorMessage={passwordError || undefined}
        aria-describedby={passwordError ? `${passwordId}-error password-rules` : 'password-rules'}
        rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />

      {/* 비밀번호 조건 */}
      <ul id="password-rules" className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-caption">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password)
          const failed = showRuleError && !passed
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-1 ${passed ? 'text-text-brand' : failed ? 'text-text-danger' : 'text-text-tertiary'}`}
            >
              {failed ? <CrossIcon /> : <CheckIcon />}
              {rule.label}
              <span className="sr-only">{passed ? ' 충족' : ' 미충족'}</span>
            </li>
          )
        })}
      </ul>

      <TextField
        className="mt-5"
        id={`${passwordId}-confirm`}
        label={`${labelPrefix}비밀번호 확인`}
        type={showConfirm ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder={`${labelPrefix}비밀번호 다시 입력`}
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value)
          // 서버 에러로 막힌 버튼이 확인 칸만 고쳐도 다시 눌리도록
          setServerError('')
        }}
        onBlur={() => setConfirmTouched(true)}
        errorMessage={showConfirmError ? '비밀번호가 일치하지 않아요.' : undefined}
        rightSlot={<PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
      />
      {isMatch && isPasswordValid && !serverError && (
        <p className="mt-2 flex items-center gap-1 text-caption text-text-brand">
          <CheckIcon />
          비밀번호가 일치해요
        </p>
      )}

      <Button type="submit" className="mt-5" disabled={!canSubmit} loading={isSubmitting}>
        {submitText}
      </Button>

      {footer}
    </form>
  )
}

export default PasswordForm
