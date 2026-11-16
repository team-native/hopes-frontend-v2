/** 가입 가능한 학교 이메일 도메인 */
export const SCHOOL_EMAIL_DOMAIN = 'gsm.hs.kr'

/** 학과 목록 */
export const DEPARTMENTS = ['소프트웨어개발과', '스마트IoT과', '인공지능과'] as const

/**
 * 가입 가능한 기수 목록
 * TODO: v1은 8·9·10기로 제한했어요. v2도 같은지, 매년 어떻게 늘릴지 확인 필요
 */
export const COHORTS = ['8기', '9기', '10기'] as const
