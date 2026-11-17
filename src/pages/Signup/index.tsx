import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendSignupCode, signup, verifySignupCode } from '../../api/auth'
import AuthFooterLink from '../../components/auth/AuthFooterLink'
import CodeStep from '../../components/auth/CodeStep'
import PasswordForm, { CheckIcon } from '../../components/auth/PasswordForm'
import ResultPanel from '../../components/auth/ResultPanel'
import StepProgress from '../../components/auth/StepProgress'
import AuthLayout from '../../components/layout/AuthLayout'
import EmailStep from './components/EmailStep'
import ProfileStep, { type Profile } from './components/ProfileStep'
import { SIGNUP_STEPS } from './constants'

const footer = <AuthFooterLink question="이미 계정이 있으신가요?" linkText="로그인" to="/login" />

function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  // 1단계(이메일 인증) 안의 화면: 이메일 입력 → 인증번호 입력
  const [emailPhase, setEmailPhase] = useState<'email' | 'code'>('email')
  // 단계마다 모아 두었다가 마지막에 가입 요청에 사용
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  // 가입이 끝나면 완료 화면에 보여 줄 프로필
  const [completedProfile, setCompletedProfile] = useState<Profile | null>(null)

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
      {completedProfile ? (
        // 가입 완료: 진행바 없이 완료 화면만
        <ResultPanel
          icon="check"
          title={`${completedProfile.name}님, 가입이 끝났어요`}
          description={
            <>
              {completedProfile.department} · {completedProfile.cohort}로 가입했어요.
              <br />
              이제 선배에게 무엇이든 물어보세요.
            </>
          }
          buttonText="시작하기"
          // TODO: 가입 후 자동 로그인 여부를 백엔드와 정하고, 메인(채팅) 화면 경로가 정해지면 바꾸기
          onButtonClick={() => navigate('/', { replace: true })}
        />
      ) : (
        <>
          <StepProgress title="회원가입" current={step} steps={SIGNUP_STEPS} />

          {step === 1 && emailPhase === 'email' && (
            <EmailStep
              defaultEmail={email}
              onSent={(sentEmail) => {
                setEmail(sentEmail)
                setEmailPhase('code')
              }}
            />
          )}

          {step === 1 && emailPhase === 'code' && (
            <CodeStep
              email={email}
              description="메일이 안 왔다면 스팸함을 확인해 주세요."
              resendCode={sendSignupCode}
              verifyCode={verifySignupCode}
              onChangeEmail={() => {
                setVerificationCode('')
                setEmailPhase('email')
              }}
              onVerified={() => setStep(2)}
              onCodeVerified={setVerificationCode}
              footer={footer}
            />
          )}

          {step === 2 && (
            <PasswordForm
              heading={
                <>
                  로그인에 쓸 <span className="text-text-brand">비밀번호</span>를 만들어 주세요
                </>
              }
              description={
                <p className="mt-md flex items-center gap-1.5 text-caption font-medium text-text-brand">
                  <CheckIcon />
                  {email} 인증 완료
                </p>
              }
              submitText="다음"
              onSubmit={(pw) => {
                setPassword(pw)
                setStep(3)
              }}
              footer={footer}
            />
          )}

          {step === 3 && (
            <ProfileStep
              onRestartVerification={() => {
                // 인증번호는 버리고 이메일은 남겨서 1단계(이메일 입력)부터 다시
                setVerificationCode('')
                setEmailPhase('email')
                setStep(1)
              }}
              onSubmit={async (profile) => {
                await signup({ email, password, verificationCode, ...profile })
                setCompletedProfile(profile)
              }}
            />
          )}
        </>
      )}
    </AuthLayout>
  )
}

export default SignupPage
