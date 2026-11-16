import { SCHOOL_EMAIL_DOMAIN } from '../constants/school'

const SCHOOL_EMAIL_REGEX = new RegExp(`^[^\\s@]+@${SCHOOL_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`, 'i')

/** 학교 이메일(@gsm.hs.kr) 형식이 맞는지 */
export function isSchoolEmail(email: string) {
  return SCHOOL_EMAIL_REGEX.test(email.trim())
}

/**
 * 입력 중인 값이 이미 학교 도메인이 될 수 없는지 (입력하는 동안 바로 에러를 띄우기 위함)
 * 예) "s26055@g" → false (아직 gsm.hs.kr이 될 수 있음), "s26055@gmail" → true
 */
export function hasWrongEmailDomain(email: string) {
  const at = email.indexOf('@')
  if (at === -1) return false
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase()
  return !SCHOOL_EMAIL_DOMAIN.startsWith(domain)
}
