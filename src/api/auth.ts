import axios from 'axios'
import client from './client'
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

function throwApiError(error: unknown): never {
  if (!axios.isAxiosError(error)) throw error
  const status = error.response?.status
  const payload = error.response?.data as { code?: string; message?: string } | undefined
  const message = payload?.message
  const code =
    payload?.code ??
    (status === 401 ? 'INVALID_CREDENTIALS' : status === 409 ? 'EMAIL_ALREADY_REGISTERED' : undefined) ??
    (status === 404 && /계정|이메일|사용자/.test(message ?? '') ? 'EMAIL_NOT_REGISTERED' : undefined) ??
    (status === 429 ? 'TOO_MANY_ATTEMPTS' : undefined) ??
    (status === 400 && /인증번호|코드/.test(message ?? '') ? 'INVALID_CODE' : undefined) ??
    (status === 400 && /이전.*비밀번호|기존.*비밀번호/.test(message ?? '') ? 'SAME_AS_OLD_PASSWORD' : undefined)
  throw new Error(code ?? payload?.message ?? error.message)
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
