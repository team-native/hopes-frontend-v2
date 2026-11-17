import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../components/common/Button'
import Checkbox from '../../../components/common/Checkbox'
import FieldError from '../../../components/common/FieldError'
import Select from '../../../components/common/Select'
import TextField from '../../../components/common/TextField'
import { COHORTS, DEPARTMENTS } from '../../../constants/school'
import { RETRY_LATER, getErrorCode } from '../../../utils/error'

const SIGNUP_ERRORS: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: '이미 가입된 이메일이에요. 로그인해 주세요.',
  INVALID_CODE: '이메일 인증이 만료됐어요. 인증번호를 다시 받아 주세요.',
  TOO_MANY_ATTEMPTS: `요청이 너무 많아요. ${RETRY_LATER}`,
}

/** 서버가 알려 준 이유를 그대로 보여 주고, 아는 코드면 안내 문구로 바꿔요 */
function signupErrorMessage(error: unknown) {
  const code = getErrorCode(error)
  if (!code) return `가입하지 못했어요. ${RETRY_LATER}`
  if (SIGNUP_ERRORS[code]) return SIGNUP_ERRORS[code]
  // 정규화되지 않은 에러 코드는 사용자에게 의미가 없어서 기본 문구로 바꿔요
  return /^[A-Z0-9_]+$/.test(code) ? `가입하지 못했어요. ${RETRY_LATER}` : code
}

export interface Profile {
  name: string
  department: string
  cohort: string
  agreeTerms: boolean
  agreePrivacy: boolean
}

interface ProfileStepProps {
  /** 가입 완료 버튼 → 가입 요청 (실패하면 throw) */
  onSubmit: (profile: Profile) => Promise<void>
}

/**
 * 회원가입 3단계: 프로필 (이름 · 과 · 기수 · 약관)
 * 덜 채웠을 때 버튼은 연한 색이지만 누를 수 있고, 누르면 빠진 항목에 에러 표시
 */
function ProfileStep({ onSubmit }: ProfileStepProps) {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [cohort, setCohort] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const agreeAll = agreeTerms && agreePrivacy
  const isComplete = name.trim() !== '' && department !== '' && cohort !== '' && agreeAll

  // 가입 완료를 누른 뒤에만 빠진 항목 에러 표시
  const nameError = submitted && name.trim() === '' ? '이름을 입력해 주세요.' : undefined
  const departmentError = submitted && department === '' ? '과를 선택해 주세요.' : undefined
  const cohortError = submitted && cohort === '' ? '기수를 선택해 주세요.' : undefined
  const agreeError = submitted && !agreeAll ? '필수 약관에 동의해 주세요.' : undefined

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (!isComplete || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ name: name.trim(), department, cohort, agreeTerms, agreePrivacy })
    } catch (error) {
      // 마지막 단계라 실패하면 꼭 알려 줘요 (입력값은 그대로 남아서 다시 누르면 돼요)
      setSubmitError(signupErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="mt-md text-title">
        <span className="text-text-brand">선배</span>에게 보여줄 기본 정보를 알려주세요
      </h2>
      <p className="mt-md text-label text-text-secondary">커뮤니티에는 이름 대신 기수만 표시돼요.</p>

      <TextField
        className="mt-md"
        id="signup-name"
        label="이름"
        autoComplete="name"
        placeholder="이름 입력"
        value={name}
        onChange={(e) => setName(e.target.value)}
        errorMessage={nameError}
      />

      <div className="mt-md grid grid-cols-2 gap-3">
        <Select
          label="과"
          placeholder="과 선택"
          options={DEPARTMENTS}
          value={department}
          onChange={setDepartment}
          errorMessage={departmentError}
        />
        <Select
          label="기수"
          placeholder="기수 선택"
          options={COHORTS}
          value={cohort}
          onChange={setCohort}
          errorMessage={cohortError}
        />
      </div>

      {/* 약관 동의 */}
      <fieldset className="mt-5">
        <legend className="sr-only">약관 동의</legend>
        <div className="space-y-2 text-label">
          <Checkbox
            className="font-semibold"
            checked={agreeAll}
            onChange={(e) => {
              setAgreeTerms(e.target.checked)
              setAgreePrivacy(e.target.checked)
            }}
          >
            전체 동의
          </Checkbox>
          <AgreementRow checked={agreeTerms} onChange={setAgreeTerms}>
            서비스 이용약관 동의 (필수)
          </AgreementRow>
          <AgreementRow checked={agreePrivacy} onChange={setAgreePrivacy}>
            개인정보 수집·이용 동의 (필수)
          </AgreementRow>
        </div>
        {agreeError && <FieldError>{agreeError}</FieldError>}
      </fieldset>

      {submitError && <FieldError className="mt-md">{submitError}</FieldError>}

      <Button type="submit" className="mt-5" inactive={!isComplete} loading={isSubmitting} loadingText="가입 중...">
        가입 완료
      </Button>

      <p className="mt-md text-center text-label text-text-secondary">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="ml-1 font-medium text-text-brand hover:underline">
          로그인
        </Link>
      </p>
    </form>
  )
}

interface AgreementRowProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: string
}

/** 약관 한 줄: 체크박스 + 오른쪽 "보기" */
function AgreementRow({ checked, onChange, children }: AgreementRowProps) {
  return (
    <div className="flex items-center justify-between">
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)}>
        {children}
      </Checkbox>
      <button
        type="button"
        // TODO: 약관 내용 화면(또는 팝업) 시안이 나오면 연결
        onClick={() => {}}
        aria-label={`${children} 내용 보기`}
        className="shrink-0 text-caption text-text-tertiary transition hover:text-text-secondary"
      >
        보기
      </button>
    </div>
  )
}

export default ProfileStep
