import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword, sendPasswordResetCode, verifyPasswordResetCode } from '../../api/auth'
import AuthFooterLink from '../../components/auth/AuthFooterLink'
import CodeStep from '../../components/auth/CodeStep'
import PasswordForm from '../../components/auth/PasswordForm'
import ResultPanel from '../../components/auth/ResultPanel'
import StepProgress from '../../components/auth/StepProgress'
import AuthLayout from '../../components/layout/AuthLayout'
import EmailStep from './components/EmailStep'

/** 비밀번호 찾기 단계 이름 */
const FIND_PASSWORD_STEPS = ['이메일 인증', '인증번호 확인', '새 비밀번호'] as const

const footer = <AuthFooterLink question="비밀번호가 생각났나요?" linkText="로그인" to="/login" />

function FindPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
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
              <span className="text-primary">비밀번호</span>를 바꿨어요
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
                setStep(2)
              }}
            />
          )}

          {step === 2 && (
            <CodeStep
              email={email}
              resendCode={sendPasswordResetCode}
              verifyCode={verifyPasswordResetCode}
              onChangeEmail={() => setStep(1)}
              onVerified={() => setStep(3)}
              footer={footer}
            />
          )}

          {step === 3 && (
            <PasswordForm
              heading={
                <>
                  <span className="text-primary">새 비밀번호</span>를 만들어 주세요
                </>
              }
              description={
                <p className="mt-[18px] text-[15px] leading-[22px] text-sub">이전에 쓰던 비밀번호와 다르게 만들어 주세요.</p>
              }
              labelPrefix="새 "
              submitText="비밀번호 변경"
              onSubmit={async (password) => {
                try {
                  await resetPassword(email, password)
                  setIsDone(true)
                } catch (error) {
                  if (error instanceof Error && error.message === 'SAME_AS_OLD_PASSWORD') {
                    return '이전에 쓴 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.'
                  }
                  // TODO: 그 외 에러(네트워크 등) 처리
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
