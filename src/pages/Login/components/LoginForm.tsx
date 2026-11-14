import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../../../api/auth'
import { useOnlineStatus } from '../../../hooks/useOnlineStatus'

const inputBase =
  'h-[46px] w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-[#b4b8c4]'
const inputNormal = 'border-line focus:border-focus'
const inputError = 'border-error'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLogin, setKeepLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const isOnline = useOnlineStatus()

  const hasError = errorMessage !== ''
  const inputClass = `${inputBase} ${hasError ? inputError : inputNormal}`

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
      <h2 className="text-2xl font-bold">로그인</h2>
      <p className="mt-2 text-xs text-sub">학교 이메일로 로그인하고 바로 질문을 시작하세요.</p>

      {!isOnline && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-toast px-4 py-2.5 text-[11px] text-white"
        >
          <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" aria-hidden>
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

      <div className={`${isOnline ? 'mt-6' : 'mt-5'} space-y-5`}>
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-medium text-sub">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="s00000@gsm.hs.kr"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorMessage('')
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'login-error' : undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-medium text-sub">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorMessage('')
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'login-error' : undefined}
            className={inputClass}
          />
          {hasError && (
            <p id="login-error" role="alert" className="mt-2 flex items-center gap-1 text-[11px] text-error">
              <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.8v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.9" fill="currentColor" />
              </svg>
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={keepLogin}
            onChange={(e) => setKeepLogin(e.target.checked)}
            className="peer sr-only"
          />
          <span className="flex size-4 items-center justify-center rounded border border-line bg-white text-white transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30">
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" aria-hidden>
              <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          로그인 유지
        </label>
        <Link to="/find-password" className="text-xs font-medium text-primary hover:underline">
          비밀번호 찾기
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isOnline}
        aria-busy={isLoading}
        className={`mt-5 h-[42px] w-full rounded-xl bg-primary text-sm font-medium text-white transition enabled:hover:bg-primary-hover enabled:active:scale-[0.99] disabled:cursor-not-allowed ${
          isLoading ? 'disabled:bg-primary-loading' : 'disabled:bg-primary-disabled'
        }`}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <p className="mt-4 text-center text-xs text-sub">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="ml-1 font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
