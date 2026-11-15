import { useState, type FormEvent } from 'react'
import { sendPasswordResetCode } from '../../../api/auth'
import AuthFooterLink from '../../../components/auth/AuthFooterLink'
import Button from '../../../components/common/Button'
import FieldError from '../../../components/common/FieldError'
import TextField from '../../../components/common/TextField'
import { SCHOOL_EMAIL_DOMAIN } from '../../../constants/school'
import { hasWrongEmailDomain, isSchoolEmail } from '../../../utils/email'
import { RETRY_LATER, getErrorCode } from '../../../utils/error'

const DOMAIN_ERROR = `학교 이메일(@${SCHOOL_EMAIL_DOMAIN})만 사용할 수 있어요.`
const NOT_REGISTERED_ERROR = '가입되지 않은 이메일이에요. 회원가입을 진행해 주세요.'

interface EmailStepProps {
  /** "변경"으로 돌아왔을 때 미리 채워 둘 이메일 */
  defaultEmail?: string
  /** 인증번호 발송에 성공하면 호출 */
  onSent: (email: string) => void
}

/** 비밀번호 찾기 1단계: 가입한 학교 이메일 입력 */
function EmailStep({ defaultEmail = '', onSent }: EmailStepProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [submitted, setSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isNotRegistered, setIsNotRegistered] = useState(false)
  const [sendError, setSendError] = useState('')

  let errorMessage = ''
  if (hasWrongEmailDomain(email)) {
    errorMessage = DOMAIN_ERROR
  } else if (isNotRegistered) {
    errorMessage = NOT_REGISTERED_ERROR
  } else if (submitted && !isSchoolEmail(email)) {
    errorMessage = email.trim() === '' ? '학교 이메일을 입력해 주세요.' : DOMAIN_ERROR
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (!isSchoolEmail(email) || isSending) return

    const trimmed = email.trim()
    setIsSending(true)
    setSendError('')
    try {
      await sendPasswordResetCode(trimmed)
      onSent(trimmed)
    } catch (error) {
      if (getErrorCode(error) === 'EMAIL_NOT_REGISTERED') {
        setIsNotRegistered(true)
      } else {
        // 네트워크 · 서버 오류: 버튼은 막지 않고 다시 누를 수 있게 안내만
        setSendError(`인증번호를 보내지 못했어요. ${RETRY_LATER}`)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="mt-md text-title">
        가입한 <span className="text-text-brand">학교 이메일</span>을 입력해 주세요
      </h2>
      <p className="mt-md text-label text-text-secondary">인증번호를 보내 본인 확인을 할게요.</p>

      <TextField
        className="mt-md"
        id="find-password-email"
        label="학교 이메일"
        type="email"
        autoComplete="email"
        placeholder={`s00000@${SCHOOL_EMAIL_DOMAIN}`}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setSubmitted(false)
          setIsNotRegistered(false)
          setSendError('')
        }}
        errorMessage={errorMessage}
      />
      {sendError && !errorMessage && <FieldError>{sendError}</FieldError>}

      <Button type="submit" className="mt-5" loading={isSending} disabled={errorMessage !== ''}>
        인증번호 받기
      </Button>

      {/* 가입 안 된 이메일이면 회원가입으로 안내 */}
      {isNotRegistered ? (
        <AuthFooterLink question="계정이 없으신가요?" linkText="회원가입" to="/signup" />
      ) : (
        <AuthFooterLink question="비밀번호가 생각났나요?" linkText="로그인" to="/login" />
      )}
    </form>
  )
}

export default EmailStep
