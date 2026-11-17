import axios from 'axios'

/**
 * API 에러에서 에러 코드를 꺼내요. (예: 'INVALID_CODE', 'EMAIL_ALREADY_REGISTERED')
 * API 계층에서 백엔드 에러를 Error('코드') 형태로 정규화합니다.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined
  return error.message.startsWith('Request failed with status code') ? undefined : error.message
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
