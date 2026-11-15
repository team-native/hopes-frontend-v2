import { Link } from 'react-router-dom'

interface AuthFooterLinkProps {
  /** 앞쪽 회색 글자 (예: "이미 계정이 있으신가요?") */
  question: string
  /** 파란 링크 글자 (예: "로그인") */
  linkText: string
  to: string
}

/** 폼 맨 아래 "이미 계정이 있으신가요? 로그인" 한 줄 */
function AuthFooterLink({ question, linkText, to }: AuthFooterLinkProps) {
  return (
    <p className="mt-md text-center text-label text-text-secondary">
      {question}{' '}
      <Link to={to} className="ml-1 font-medium text-text-brand hover:underline">
        {linkText}
      </Link>
    </p>
  )
}

export default AuthFooterLink
