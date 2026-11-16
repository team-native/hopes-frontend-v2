/**
 * API 에러에서 에러 코드를 꺼내요. (예: 'INVALID_CODE', 'EMAIL_ALREADY_REGISTERED')
 * 지금 API 함수들은 Error('코드') 형태로 던져요. 코드가 없는 에러(네트워크 끊김, 서버 500 등)는 undefined.
 * TODO: 백엔드 에러 응답 형식이 정해지면 axios 에러에서 코드를 꺼내도록 여기만 바꾸면 돼요.
 */
export function getErrorCode(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined
}

/** 원인을 특정할 수 없는 실패(네트워크, 서버 오류 등) 뒤에 붙이는 안내 */
export const RETRY_LATER = '잠시 후 다시 시도해 주세요.'
