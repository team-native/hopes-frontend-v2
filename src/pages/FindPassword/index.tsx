import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword, sendPasswordResetCode, verifyPasswordResetCode } from '../../api/auth'
import AuthFooterLink from '../../components/auth/AuthFooterLink'
import CodeStep from '../../components/auth/CodeStep'
import PasswordForm from '../../components/auth/PasswordForm'
import ResultPanel from '../../components/auth/ResultPanel'
import StepProgress from '../../components/auth/StepProgress'
import AuthLayout from '../../components/layout/AuthLayout'
import { RETRY_LATER, getErrorCode, getServerMessage } from '../../utils/error'
import EmailStep from './components/EmailStep'

/** 비밀번호 찾기 단계 이름 */
const FIND_PASSWORD_STEPS = ['이메일 인증', '인증번호 확인', '새 비밀번호'] as const

const footer = <AuthFooterLink question="비밀번호가 생각났나요?" linkText="로그인" to="/login" />

function FindPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [isDone, setIsDone] = useState(false)

  return (
    <AuthLayout
      description={
        <>
          광주소프트웨어마이스터고 학교생활·전공·취업 질문에
          <br />
          선배들이 남긴 경험으로 답해요.
        </>
      }
    >
      {isDone ? (
        // 변경 완료: 진행바 없이 결과 화면만
        <ResultPanel
          icon="lock"
          title={
            <>
              <span className="text-text-brand">비밀번호</span>를 바꿨어요
            </>
          }
          description="새 비밀번호로 다시 로그인해 주세요."
          buttonText="로그인하기"
          onButtonClick={() => navigate('/login', { replace: true })}
        />
      ) : (
        <>
          <StepProgress title="비밀번호 찾기" current={step} steps={FIND_PASSWORD_STEPS} />

          {step === 1 && (
            <EmailStep
              defaultEmail={email}
              onSent={(sentEmail) => {
                setEmail(sentEmail)
                setVerificationCode('')
                setVerificationError('')
                setStep(2)
              }}
            />
          )}

          {step === 2 && (
            <CodeStep
              email={email}
              description="인증번호는 새 비밀번호를 저장할 때 서버에서 확인해요."
              initialError={verificationError}
              resendCode={sendPasswordResetCode}
              verifyCode={verifyPasswordResetCode}
              onChangeEmail={() => {
                setVerificationError('')
                setStep(1)
              }}
              onVerified={() => setStep(3)}
              onCodeVerified={setVerificationCode}
              footer={footer}
            />
          )}

          {step === 3 && (
            <PasswordForm
              heading={
                <>
                  <span className="text-text-brand">새 비밀번호</span>를 만들어 주세요
                </>
              }
              description={
                <p className="mt-md text-label text-text-secondary">이전에 쓰던 비밀번호와 다르게 만들어 주세요.</p>
              }
              labelPrefix="새 "
              submitText="비밀번호 변경"
              onSubmit={async (password) => {
                try {
                  await resetPassword(email, verificationCode, password)
                  setIsDone(true)
                } catch (error) {
                  if (getErrorCode(error) === 'SAME_AS_OLD_PASSWORD') {
                    return '이전에 쓴 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.'
                  }
                  if (getErrorCode(error) === 'INVALID_CODE') {
                    setVerificationError('인증번호가 맞지 않아요. 다시 확인해 주세요.')
                    setStep(2)
                    return
                  }
                  // 비밀번호 규칙 위반 · 계정 없음 등은 서버 문구로, 네트워크 · 서버 오류는 기본 문구로
                  return getServerMessage(error) ?? `비밀번호를 바꾸지 못했어요. ${RETRY_LATER}`
                }
              }}
              footer={footer}
            />
          )}
        </>
      )}
    </AuthLayout>
  )
}

export default FindPasswordPage
