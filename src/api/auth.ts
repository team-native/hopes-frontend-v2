// import client from './client'

export interface LoginRequest {
  email: string
  password: string
  keepLogin: boolean
}

/**
 * 로그인 요청
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   const { data } = await client.post('/auth/login', request)
 *   return data
 */
export async function login(request: LoginRequest): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: 지금은 항상 실패 처리해서 에러 화면을 확인할 수 있게 해 둠
  void request
  throw new Error('INVALID_CREDENTIALS')
}

/**
 * 회원가입 인증번호 발송
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/signup/code', { email })
 *   이미 가입된 이메일이면 서버 응답에 맞춰 Error('EMAIL_ALREADY_REGISTERED')로 바꿔서 던져 주세요.
 */
export async function sendSignupCode(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: 아래 목록에 있는 이메일만 "이미 가입됨", 나머지는 발송 성공
  if (MOCK_REGISTERED_EMAILS.includes(email.toLowerCase())) {
    throw new Error('EMAIL_ALREADY_REGISTERED')
  }
}

/**
 * 회원가입 인증번호 확인
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/signup/code/verify', { email, code })
 *   번호가 틀리면 서버 응답에 맞춰 Error('INVALID_CODE')로 바꿔서 던져 주세요.
 */
export async function verifySignupCode(email: string, code: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: MOCK_CODE만 정답
  void email
  if (code !== MOCK_CODE) {
    throw new Error('INVALID_CODE')
  }
}

/**
 * 비밀번호 찾기 인증번호 발송
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/password/code', { email })
 *   가입되지 않은 이메일이면 서버 응답에 맞춰 Error('EMAIL_NOT_REGISTERED')로 바꿔서 던져 주세요.
 */
export async function sendPasswordResetCode(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: 아래 목록에 있는 이메일만 "가입 안 됨", 나머지는 발송 성공
  if (MOCK_UNREGISTERED_EMAILS.includes(email.toLowerCase())) {
    throw new Error('EMAIL_NOT_REGISTERED')
  }
}

/**
 * 비밀번호 찾기 인증번호 확인
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/password/code/verify', { email, code })
 */
export async function verifyPasswordResetCode(email: string, code: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: MOCK_CODE만 정답
  void email
  if (code !== MOCK_CODE) {
    throw new Error('INVALID_CODE')
  }
}

/**
 * 비밀번호 재설정 (비밀번호 찾기 마지막 단계)
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/password/reset', { email, password })
 *   이전 비밀번호와 같으면 서버 응답에 맞춰 Error('SAME_AS_OLD_PASSWORD')로 바꿔서 던져 주세요.
 */
export async function resetPassword(email: string, password: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: MOCK_OLD_PASSWORD와 같으면 "이전 비밀번호와 같음"
  void email
  if (password === MOCK_OLD_PASSWORD) {
    throw new Error('SAME_AS_OLD_PASSWORD')
  }
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  department: string
  cohort: string
  agreeTerms: boolean
  agreePrivacy: boolean
}

/**
 * 회원가입 (마지막 단계)
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/signup', request)
 */
export async function signup(request: SignupRequest): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // 가짜 응답: 항상 성공
  void request
}

// ---- 가짜 데이터 (백엔드 연동 후 삭제) ----
/** 회원가입: 이 이메일로 인증번호를 받으면 "이미 가입된 이메일" 팝업이 떠요 */
const MOCK_REGISTERED_EMAILS = ['taken@gsm.hs.kr']
/** 비밀번호 찾기: 이 이메일로 인증번호를 받으면 "가입되지 않은 이메일" 에러가 떠요 */
const MOCK_UNREGISTERED_EMAILS = ['s99999@gsm.hs.kr']
/** 가짜 인증번호 정답 (회원가입 · 비밀번호 찾기 공통) */
const MOCK_CODE = '123456'
/** 비밀번호 재설정: 이 값으로 바꾸려고 하면 "이전 비밀번호와 같음" 에러가 떠요 */
const MOCK_OLD_PASSWORD = 'abcd123!'
