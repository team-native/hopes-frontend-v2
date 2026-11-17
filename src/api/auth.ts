import axios from 'axios'
import client from './client'
import { ApiError } from '../utils/error'
import { clearToken, setToken } from '../utils/token'

export interface LoginRequest {
  email: string
  password: string
  keepLogin: boolean
}

export interface SignupRequest {
  email: string
  password: string
  verificationCode: string
  name: string
  department: string
  cohort: string
  agreeTerms: boolean
  agreePrivacy: boolean
}

type TokenResponse = { accessToken: string; tokenType: string }

/**
 * 서버가 code에 넣어 주는 HTTP 상태 이름들 (예: 400 → "BAD_REQUEST")
 * 원인을 구분해 주지 않아서 무시하고, 상태 코드 + message 문구로 원인을 판단해요.
 */
const GENERIC_SERVER_CODES = new Set([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'INTERNAL_SERVER_ERROR',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
])

/**
 * 상태 코드와 서버 문구로 원인 코드를 추측해요. (서버 문구 예시는 Swagger · 실제 응답 기준)
 * - 401 "등록된 회원을 찾을 수 없습니다." → INVALID_CREDENTIALS
 * - 400 "인증번호를 먼저 요청해주세요" · "인증번호가 일치하지 않습니다" → INVALID_CODE
 *
 * ⚠️ 임시 방법이에요. 문구 비교라서 백엔드가 문구를 바꾸면 조용히 기본 문구로 빠질 수 있어요.
 * 백엔드가 세부 code(예: EMAIL_EXPIRED)를 주기 시작하면 throwApiError가 그 값을 먼저 쓰니,
 * 그때 화면의 원인 코드 이름만 맞추고 이 함수는 줄이거나 지우면 돼요.
 */
function guessErrorCode(status: number | undefined, message: string): string | undefined {
  if (status === 401) return 'INVALID_CREDENTIALS'
  if (status === 429) return 'TOO_MANY_ATTEMPTS'
  if (status === 409 || (status === 400 && /이미.*(가입|등록|사용|존재)/.test(message))) {
    return 'EMAIL_ALREADY_REGISTERED'
  }
  if (status === 404 && /계정|이메일|사용자|회원/.test(message)) return 'EMAIL_NOT_REGISTERED'
  if (status === 400 && /(이전|기존).*비밀번호/.test(message)) return 'SAME_AS_OLD_PASSWORD'
  if (status === 400 && /인증번호|코드/.test(message)) return 'INVALID_CODE'
  return undefined
}

/** axios 에러를 ApiError(원인 코드 + 서버 문구)로 바꿔서 던져요 */
function throwApiError(error: unknown): never {
  if (!axios.isAxiosError(error)) throw error
  // 네트워크 끊김 · 시간 초과처럼 응답 자체가 없으면 서버 문구도 없어서 화면은 기본 문구를 보여 줘요
  if (!error.response) throw new ApiError({ code: 'NETWORK_ERROR', cause: error })
  const status = error.response.status
  const payload = error.response.data as { code?: unknown; message?: unknown } | undefined
  const serverMessage = typeof payload?.message === 'string' ? payload.message : undefined
  const serverCode =
    typeof payload?.code === 'string' && !GENERIC_SERVER_CODES.has(payload.code) ? payload.code : undefined
  throw new ApiError({
    code: serverCode ?? guessErrorCode(status, serverMessage ?? ''),
    status,
    serverMessage,
    cause: error,
  })
}

function persistToken(token: string, keepLogin: boolean) {
  setToken(token, keepLogin)
}

export async function login(request: LoginRequest): Promise<void> {
  try {
    const { data } = await client.post<TokenResponse>('/api/login', {
      username: request.email.trim(),
      password: request.password,
    })
    persistToken(data.accessToken, request.keepLogin)
  } catch (error) {
    throwApiError(error)
  }
}

export async function logout(): Promise<void> {
  try {
    await client.post('/api/logout')
  } finally {
    clearToken()
  }
}

export async function deleteAccount(password: string): Promise<void> {
  try {
    await client.delete('/api/account', { data: { password } })
  } catch (error) {
    // 서버는 비밀번호 불일치와 로그인 만료를 둘 다 401 + code "UNAUTHORIZED"로 줘서 message로 구분해요.
    // (hopes-server HopesServices.deleteAccount: "비밀번호가 일치하지 않습니다" / "로그인이 필요합니다")
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const message = (error.response.data as { message?: unknown } | undefined)?.message
      const serverMessage = typeof message === 'string' ? message : undefined
      if (serverMessage?.includes('비밀번호')) {
        throw new ApiError({ code: 'INVALID_PASSWORD', status: 401, serverMessage, cause: error })
      }
      // 로그인 만료 — client는 이 요청의 401에서 토큰을 지우지 않으므로 여기서 로그아웃 처리
      clearToken()
      throw new ApiError({ code: 'SESSION_EXPIRED', status: 401, serverMessage, cause: error })
    }
    throwApiError(error)
  }
  localStorage.removeItem('hopes:access-token')
  sessionStorage.removeItem('hopes:access-token')
  window.dispatchEvent(new Event('hopes:logged-out'))
}

export async function sendSignupCode(email: string): Promise<void> {
  try {
    await client.post('/api/signup/email-verifications', { email })
  } catch (error) {
    throwApiError(error)
  }
}

export async function verifySignupCode(email: string, code: string): Promise<void> {
  try {
    await client.post('/api/signup/email-verifications/confirm', { email, code })
  } catch (error) {
    throwApiError(error)
  }
}

export async function sendPasswordResetCode(email: string): Promise<void> {
  try {
    await client.post('/api/password/request', { email })
  } catch (error) {
    throwApiError(error)
  }
}

export async function verifyPasswordResetCode(_email: string, code: string): Promise<void> {
  if (!/^\d{6}$/.test(code)) throw new Error('INVALID_CODE')
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  try {
    await client.post('/api/password/reset', {
      email,
      code,
      newPassword: password,
      passwordConfirm: password,
    })
  } catch (error) {
    throwApiError(error)
  }
}

export async function signup(request: SignupRequest): Promise<void> {
  try {
    const { data } = await client.post<TokenResponse>('/api/signup', {
      email: request.email,
      username: request.name,
      password: request.password,
      passwordConfirm: request.password,
      verificationCode: request.verificationCode,
      major: request.department,
      cohort: Number.parseInt(request.cohort, 10),
    })
    persistToken(data.accessToken, true)
  } catch (error) {
    throwApiError(error)
  }
}
