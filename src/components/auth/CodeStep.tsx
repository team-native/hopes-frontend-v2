import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Button from '../common/Button'
import CodeInput from '../common/CodeInput'
import FieldError from '../common/FieldError'

/** 인증번호 유효 시간 (초) */
const CODE_TTL_SECONDS = 5 * 60
const CODE_LENGTH = 6
/** 이 횟수만큼 틀리면 잠금 */
const MAX_ATTEMPTS = 5
/** 잠금 시간 (분) */
const LOCK_MINUTES = 10

interface CodeStepProps {
  email: string
  /** 제목 아래 설명 (없으면 생략) */
  description?: ReactNode
  /** 인증번호 다시 보내기 API */
  resendCode: (email: string) => Promise<void>
  /** 인증번호 확인 API (틀리면 Error('INVALID_CODE'), 잠기면 Error('TOO_MANY_ATTEMPTS')) */
  verifyCode: (email: string, code: string) => Promise<void>
  /** "변경" 눌렀을 때 → 이메일 입력으로 돌아가기 */
  onChangeEmail: () => void
  /** 인증 성공 */
  onVerified: () => void
  /** 맨 아래 링크 (예: <AuthFooterLink ... />) */
  footer: ReactNode
}

function formatTime(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

/**
 * 메일로 받은 인증번호 입력 (회원가입 · 비밀번호 찾기 공통)
 * 상태: 입력 중 → 틀림(n/5회) → 5회 틀리면 10분 잠금 / 5분 지나면 시간 초과
 */
function CodeStep({ email, description, resendCode, verifyCode, onChangeEmail, onVerified, footer }: CodeStepProps) {
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + CODE_TTL_SECONDS * 1000)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [failCount, setFailCount] = useState(0)
  const [isWrong, setIsWrong] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const isLocked = now < lockedUntil
  const isExpired = !isLocked && remaining === 0

  // 1초마다 시간 갱신 (타이머 · 잠금 해제 확인)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const lock = () => {
    setLockedUntil(Date.now() + LOCK_MINUTES * 60 * 1000)
    setCode('')
    setIsWrong(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (code.length < CODE_LENGTH || isExpired || isLocked || isVerifying) return

    setIsVerifying(true)
    try {
      await verifyCode(email, code)
      onVerified()
    } catch (error) {
      // TODO: 실제로는 서버가 횟수를 세고 잠가야 해요. 서버가 잠금 응답을 주면 그걸 우선해요.
      if (error instanceof Error && error.message === 'TOO_MANY_ATTEMPTS') {
        lock()
        return
      }
      const nextCount = failCount + 1
      setFailCount(nextCount)
      if (nextCount >= MAX_ATTEMPTS) {
        lock()
      } else {
        setIsWrong(true)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (isResending || isLocked) return
    setIsResending(true)
    try {
      await resendCode(email)
      setCode('')
      setIsWrong(false)
      setFailCount(0)
      setExpiresAt(Date.now() + CODE_TTL_SECONDS * 1000)
      setNow(Date.now())
    } finally {
      setIsResending(false)
    }
  }

  let codeError = ''
  if (isExpired) {
    codeError = '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.'
  } else if (isWrong) {
    codeError = `인증번호가 맞지 않아요. 다시 확인해 주세요. (${failCount}/${MAX_ATTEMPTS}회)`
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="mt-[17px] text-[25px] leading-8 font-semibold">
        메일로 받은 <span className="text-primary">인증번호</span>를 입력해 주세요
      </h2>
      {description && <p className="mt-[18px] text-[15px] leading-[22px] text-sub">{description}</p>}

      {/* 인증번호를 보낸 이메일 (수정 불가, "변경"으로 돌아가기) */}
      <div className={description ? 'mt-[17px]' : 'mt-[18px]'}>
        <p id="code-email-label" className="mb-1.5 text-[15px] leading-5 font-medium text-sub">
          학교 이메일
        </p>
        <div
          aria-labelledby="code-email-label"
          className="flex h-[58px] items-center justify-between rounded-xl border border-line bg-[#f7f9fc] px-4"
        >
          <span className="truncate text-[17px]">{email}</span>
          <button
            type="button"
            onClick={onChangeEmail}
            className="ml-3 shrink-0 text-[15px] font-medium text-primary hover:underline"
          >
            변경
          </button>
        </div>
      </div>

      {/* 5회 틀려서 잠김 */}
      {isLocked && (
        <FieldError className="mt-4 gap-2 rounded-xl bg-error-bg px-4 py-2.5 leading-[22px]">
          인증번호를 {MAX_ATTEMPTS}회 틀렸어요. {LOCK_MINUTES}분 뒤에 다시 시도해 주세요.
        </FieldError>
      )}

      <div className={isLocked ? 'mt-4' : 'mt-[17px]'}>
        <p className="mb-2 text-[15px] leading-5 font-medium text-sub">인증번호 {CODE_LENGTH}자리</p>
        <CodeInput
          value={code}
          onChange={(next) => {
            setCode(next)
            setIsWrong(false)
          }}
          length={CODE_LENGTH}
          invalid={isWrong}
          disabled={isExpired || isLocked}
          autoFocus
          aria-label="인증번호"
          aria-describedby={codeError ? 'code-error' : undefined}
        />
        {codeError && <FieldError id="code-error">{codeError}</FieldError>}
      </div>

      {/* 타이머 · 다시 받기 (잠금 중에는 숨김) */}
      {!isLocked && (
        <div className="mt-[17px] flex items-center justify-between text-[15px] leading-[22px]">
          <span
            className={`flex items-center gap-1.5 font-medium tabular-nums ${isExpired ? 'text-error' : 'text-primary'}`}
            aria-label={`남은 시간 ${formatTime(remaining)}`}
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.8V8l2 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {formatTime(remaining)}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sub transition hover:text-ink disabled:opacity-50"
          >
            {isResending ? '보내는 중...' : '인증번호 다시 받기'}
          </button>
        </div>
      )}

      {/* 시간 초과 · 잠금이면 버튼이 "인증번호 다시 받기"로 바뀜 */}
      {isExpired || isLocked ? (
        <Button
          type="button"
          className={isLocked ? 'mt-5' : 'mt-4'}
          onClick={handleResend}
          loading={isResending}
          disabled={isLocked}
        >
          인증번호 다시 받기
        </Button>
      ) : (
        <Button type="submit" className="mt-4" loading={isVerifying}>
          확인
        </Button>
      )}

      {footer}
    </form>
  )
}

export default CodeStep
