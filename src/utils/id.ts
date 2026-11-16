/**
 * 화면에서만 쓰는 임시 ID.
 * crypto.randomUUID()는 보안 컨텍스트(https · localhost)에서만 동작해서,
 * `npm run dev -- --host`로 휴대폰에서 http IP로 접속하면 오류가 나요. 그래서 시간 + 난수로 만들어요.
 */
export function createId(prefix = 'local') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
