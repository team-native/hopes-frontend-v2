// import client from './client'

/*
 * ⚠️ 지금 이 파일의 함수들은 모두 "가짜 응답"이에요 (백엔드 연동 전).
 * 맨 아래 "가짜 데이터"의 값을 넣으면 각 상황(이미 가입됨, 틀림, 서버 오류 등)을 화면에서 확인할 수 있어요.
 * 에러는 Error('에러코드')로 던지고, 화면은 utils/error.ts의 getErrorCode()로 코드를 꺼내서 구분해요.
 * 코드가 없는 에러(네트워크 끊김, 서버 500)는 "잠시 후 다시 시도해 주세요"로 안내돼요.
 */

export interface LoginRequest {
  email: string
  password: string
  keepLogin: boolean
}

/**
 * 로그인 요청
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   const { data } = await client.post('/auth/login', request)
 *   이메일·비밀번호가 틀리면 서버 응답에 맞춰 Error('INVALID_CREDENTIALS')로 바꿔서 던져 주세요.
 */
export async function login(request: LoginRequest): Promise<void> {
  await delay()
  if (isMockServerErrorEmail(request.email)) throwMockServerError()

  // 가짜 응답: 지금은 항상 "틀림" 처리해서 에러 화면을 확인할 수 있게 해 둠
  throw new Error('INVALID_CREDENTIALS')
}

/**
 * 회원가입 인증번호 발송
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/signup/code', { email })
 *   이미 가입된 이메일이면 서버 응답에 맞춰 Error('EMAIL_ALREADY_REGISTERED')로 바꿔서 던져 주세요.
 */
export async function sendSignupCode(email: string): Promise<void> {
  await delay()
  mockSendCodeErrors(email)

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
  await delay()
  void email
  mockVerifyCode(code)
}

/**
 * 비밀번호 찾기 인증번호 발송
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/password/code', { email })
 *   가입되지 않은 이메일이면 서버 응답에 맞춰 Error('EMAIL_NOT_REGISTERED')로 바꿔서 던져 주세요.
 */
export async function sendPasswordResetCode(email: string): Promise<void> {
  await delay()
  mockSendCodeErrors(email)

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
  await delay()
  void email
  mockVerifyCode(code)
}

/**
 * 비밀번호 재설정 (비밀번호 찾기 마지막 단계)
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   await client.post('/auth/password/reset', { email, password })
 *   이전 비밀번호와 같으면 서버 응답에 맞춰 Error('SAME_AS_OLD_PASSWORD')로 바꿔서 던져 주세요.
 */
export async function resetPassword(email: string, password: string): Promise<void> {
  await delay()
  void email
  if (password === MOCK_SERVER_ERROR_PASSWORD) throwMockServerError()

  // 가짜 응답: MOCK_OLD_PASSWORD와 같으면 "이전 비밀번호와 같음"
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
  await delay()
  if (request.name === MOCK_SERVER_ERROR_NAME) throwMockServerError()
  // 가짜 응답: 그 외에는 성공
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

/* 서버 오류(500) 흉내 — 실패했을 때 화면을 확인하는 용도 */
/** 로그인 · 인증번호 발송에서 이 이메일을 쓰면 서버 오류 */
const MOCK_SERVER_ERROR_EMAIL = 'error@gsm.hs.kr'
/** 이 이메일은 처음 발송은 성공하고, "인증번호 다시 받기"부터 서버 오류 */
const MOCK_RESEND_ERROR_EMAIL = 'resend-error@gsm.hs.kr'
/** 인증번호 확인에서 이 번호를 넣으면 서버 오류 (틀린 횟수에 안 들어가야 정상) */
const MOCK_SERVER_ERROR_CODE = '000000'
/** 회원가입 마지막 단계에서 이름을 이렇게 쓰면 서버 오류 */
const MOCK_SERVER_ERROR_NAME = '에러'
/** 비밀번호 재설정에서 이 비밀번호를 쓰면 서버 오류 */
const MOCK_SERVER_ERROR_PASSWORD = 'error123!'

const sentEmails = new Set<string>()

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 1000))
}

function throwMockServerError(): never {
  // 실제 axios 서버 오류처럼 "에러 코드가 없는" 에러
  throw new Error('Request failed with status code 500')
}

function isMockServerErrorEmail(email: string) {
  return email.trim().toLowerCase() === MOCK_SERVER_ERROR_EMAIL
}

function mockSendCodeErrors(email: string) {
  const normalized = email.trim().toLowerCase()
  if (normalized === MOCK_SERVER_ERROR_EMAIL) throwMockServerError()
  if (normalized === MOCK_RESEND_ERROR_EMAIL) {
    if (sentEmails.has(normalized)) throwMockServerError()
    sentEmails.add(normalized)
  }
}

function mockVerifyCode(code: string) {
  if (code === MOCK_SERVER_ERROR_CODE) throwMockServerError()
  if (code !== MOCK_CODE) throw new Error('INVALID_CODE')
}
