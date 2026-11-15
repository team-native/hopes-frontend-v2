import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendSignupCode } from '../../../api/auth'
import AlertDialog from '../../../components/common/AlertDialog'
import Button from '../../../components/common/Button'
import TextField from '../../../components/common/TextField'
import { SCHOOL_EMAIL_DOMAIN } from '../../../constants/school'
import { hasWrongEmailDomain, isSchoolEmail } from '../../../utils/email'

const DOMAIN_ERROR = `학교 이메일(@${SCHOOL_EMAIL_DOMAIN})만 사용할 수 있어요.`

interface EmailStepProps {
  /** "변경"으로 돌아왔을 때 미리 채워 둘 이메일 */
  defaultEmail?: string
  /** 인증번호 발송에 성공하면 호출 */
  onSent: (email: string) => void
}

/** 회원가입 1단계 (1): 학교 이메일 입력 */
function EmailStep({ defaultEmail = '', onSent }: EmailStepProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [submitted, setSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRegisteredOpen, setIsRegisteredOpen] = useState(false)

  // 다른 도메인을 입력하면 바로, 미완성 상태는 제출했을 때만 에러 표시
  let errorMessage = ''
  if (hasWrongEmailDomain(email)) {
    errorMessage = DOMAIN_ERROR
  } else if (submitted && !isSchoolEmail(email)) {
    errorMessage = email.trim() === '' ? '학교 이메일을 입력해 주세요.' : DOMAIN_ERROR
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (!isSchoolEmail(email) || isSending) return

    const trimmed = email.trim()
    setIsSending(true)
    try {
      await sendSignupCode(trimmed)
      onSent(trimmed)
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
        setIsRegisteredOpen(true)
      }
      // TODO: 그 외 에러(네트워크 등) 처리
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="mt-[17px] text-[25px] leading-8 font-semibold">
        <span className="text-primary">학교 이메일</span>로 인증해 주세요
      </h2>
      <p className="mt-[18px] text-[15px] leading-[22px] text-sub">
        @{SCHOOL_EMAIL_DOMAIN} 학교 이메일만 가입할 수 있어요.
      </p>

      <TextField
        className="mt-[17px]"
        id="signup-email"
        label="학교 이메일"
        type="email"
        autoComplete="email"
        placeholder={`s00000@${SCHOOL_EMAIL_DOMAIN}`}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setSubmitted(false)
        }}
        errorMessage={errorMessage}
      />

      <Button type="submit" className="mt-5" loading={isSending} disabled={errorMessage !== ''}>
        인증번호 받기
      </Button>

      <p className="mt-[17px] text-center text-[15px] leading-[22px] text-sub">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>

      <AlertDialog
        open={isRegisteredOpen}
        title="이미 가입된 이메일이에요"
        description="이미 가입된 계정이 있어요."
        onClose={() => setIsRegisteredOpen(false)}
      />
    </form>
  )
}

export default EmailStep
