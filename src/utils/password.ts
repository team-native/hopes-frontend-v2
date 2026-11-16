export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

/** 비밀번호 조건 (회원가입 · 비밀번호 재설정 공통) */
export const PASSWORD_RULES: PasswordRule[] = [
  { label: '8자 이상', test: (pw) => pw.length >= 8 },
  { label: '영문·숫자 조합', test: (pw) => /[A-Za-z]/.test(pw) && /\d/.test(pw) },
  { label: '특수문자 포함', test: (pw) => /[^A-Za-z0-9\s]/.test(pw) },
]

/** 모든 조건을 만족하는지 */
export function isValidPassword(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}
