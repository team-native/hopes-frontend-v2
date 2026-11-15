import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../../../api/auth'
import Button from '../../../components/common/Button'
import Checkbox from '../../../components/common/Checkbox'
import TextField from '../../../components/common/TextField'
import { useOnlineStatus } from '../../../hooks/useOnlineStatus'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLogin, setKeepLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isOnline = useOnlineStatus()

  const hasError = errorMessage !== ''

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading || !isOnline) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      await login({ email, password, keepLogin })
      // TODO: 로그인 성공 시 이동할 페이지
    } catch {
      // 요청 도중 연결이 끊긴 경우엔 위쪽 오프라인 배너가 대신 안내해요.
      if (!navigator.onLine) return
      setErrorMessage('이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-[30px] leading-9 font-bold">로그인</h2>
      <p className="mt-1.5 text-[15px] leading-[22px] text-sub">학교 이메일로 로그인하고 바로 질문을 시작하세요.</p>

      {!isOnline && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-toast px-4 py-3 text-[13px] text-white"
        >
          <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" aria-hidden>
            <path
              d="M1.5 6a9.5 9.5 0 0 1 3-1.8M7 3.6A9.5 9.5 0 0 1 14.5 6M3.8 8.6a6 6 0 0 1 2.4-1.3M9.6 7.4a6 6 0 0 1 2.6 1.2M6 11a3 3 0 0 1 4 0M2 2l12 12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          인터넷 연결이 끊겼어요. 연결되면 다시 로그인할 수 있어요.
        </div>
      )}

      <div className="mt-[17px] space-y-[18px]">
        <TextField
          id="email"
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="s00000@gsm.hs.kr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMessage('')
          }}
          invalid={hasError}
          aria-describedby={hasError ? 'password-error' : undefined}
        />

        {/* 에러 문구는 비밀번호 아래에만 표시 (이메일은 빨간 테두리만) */}
        <TextField
          id="password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrorMessage('')
          }}
          errorMessage={errorMessage}
        />
      </div>

      <div className="mt-[19px] flex items-center justify-between">
        <Checkbox className="text-[15px] leading-5" checked={keepLogin} onChange={(e) => setKeepLogin(e.target.checked)}>
          로그인 유지
        </Checkbox>
        <Link to="/find-password" className="text-[15px] leading-5 font-medium text-primary hover:underline">
          비밀번호 찾기
        </Link>
      </div>

      <Button type="submit" className="mt-[18px]" loading={isLoading} loadingText="로그인 중..." disabled={!isOnline}>
        로그인
      </Button>

      <p className="mt-[17px] text-center text-[15px] leading-[22px] text-sub">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="ml-1 font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
