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
