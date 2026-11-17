import axios from 'axios'

/**
 * API 실패를 화면에서 쓰기 좋게 정리한 에러
 * - code: 화면이 원인별로 다르게 안내할 때 쓰는 값 (예: 'INVALID_CODE'). 원인을 모르면 없어요.
 * - serverMessage: 서버가 알려 준 안내 문구 (예: "비밀번호가 일치하지 않습니다")
 */
export class ApiError extends Error {
  readonly code?: string
  readonly status?: number
  readonly serverMessage?: string

  constructor({
    code,
    status,
    serverMessage,
    cause,
  }: {
    code?: string
    status?: number
    serverMessage?: string
    cause?: unknown
  }) {
    super(code ?? serverMessage ?? 'API_ERROR', { cause })
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.serverMessage = serverMessage
  }
}

/**
 * 에러에서 원인 코드를 꺼내요. (예: 'INVALID_CODE', 'EMAIL_ALREADY_REGISTERED')
 * API 계층이 백엔드 에러를 ApiError(또는 Error('코드'))로 정규화해 둬요.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code
  if (!(error instanceof Error)) return undefined
  return error.message.startsWith('Request failed with status code') ? undefined : error.message
}

/**
 * 서버가 알려 준 안내 문구를 꺼내요. 사용자에게 그대로 보여 줘도 되는 경우만 돌려줘요.
 * - 서버 오류(5xx)나 한글이 아닌 문구(예: "Internal Server Error")는 의미가 없어서 undefined
 */
export function getServerMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || !error.serverMessage) return undefined
  if (error.status !== undefined && error.status >= 500) return undefined
  return /[가-힣]/.test(error.serverMessage) ? error.serverMessage : undefined
}

/** 원인을 특정할 수 없는 실패(네트워크, 서버 오류 등) 뒤에 붙이는 안내 */
export const RETRY_LATER = '잠시 후 다시 시도해 주세요.'

/**
 * 서버가 알려 준 실패 이유를 화면 문구로 바꿔요. (서버 응답: { code, message })
 * - 429(요청이 너무 많음) · 503(AI 준비 중) · 4xx 검증 실패는 서버 message를 그대로 보여 줘요.
 * - 네트워크 끊김 · 시간 초과 · message 없는 5xx는 fallback 뒤에 "잠시 후 다시 시도해 주세요."를 붙여요.
 */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    if (status === 429) return '요청이 너무 많아요. 1분 정도 뒤에 다시 시도해 주세요.'
    if (typeof message === 'string' && message.trim() && status !== undefined && status < 500) return message
    if (status === 503 && typeof message === 'string' && message.trim()) return message
  }
  return `${fallback} ${RETRY_LATER}`
}
