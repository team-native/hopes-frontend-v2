import { Bell, Info, LogOut, Mail, Moon, SlidersHorizontal, UserX, type LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import Button from '../common/Button'
import FieldError from '../common/FieldError'
import TextArea from '../common/TextArea'

/** 설정 카드 공통 틀: 제목 + 작은 설명 + 내용 */
function SettingsCard({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
      {title && <h3 className="text-label-strong">{title}</h3>}
      {description && <p className="mt-0.5 text-[11px] text-text-tertiary">{description}</p>}
      {children}
    </section>
  )
}

interface PromptCardProps {
  value: string
  onChange: (value: string) => void
}

/** 시스템 프롬프트 입력 카드 (Settings/Prompt Card) */
export function PromptCard({ value, onChange }: PromptCardProps) {
  return (
    <SettingsCard title="시스템 프롬프트" description="AI 응답을 만들 때 반영돼요.">
      <TextArea
        className="mt-sm"
        rows={9}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 답변은 항상 3문장 이내로 짧게 해줘."
        aria-label="시스템 프롬프트"
      />
    </SettingsCard>
  )
}

interface ContactCardProps {
  email: string
  message: string
  onEmailChange: (value: string) => void
  onMessageChange: (value: string) => void
}

/** 문의하기 카드 — 이메일 + 문의 내용 (Settings/Contact Card) */
export function ContactCard({ email, message, onEmailChange, onMessageChange }: ContactCardProps) {
  return (
    <SettingsCard>
      <label className="block">
        <span className="text-caption font-medium text-text-secondary">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="이메일"
          className="mt-xs h-11 w-full rounded-sm border border-border-default bg-bg-surface px-4 text-label transition outline-none placeholder:text-text-tertiary focus:border-border-brand"
        />
      </label>
      <TextArea
        className="mt-md [&>label]:text-caption"
        label="문의 내용"
        rows={6}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="예: 답변이 너무 짧게 나와요."
      />
    </SettingsCard>
  )
}

interface AccountCardProps {
  rows: { label: string; value: string }[]
}

/** 수정할 수 없는 계정 정보 카드 (Settings/Account Card) */
export function AccountCard({ rows }: AccountCardProps) {
  return (
    <SettingsCard title="계정 정보" description="수정할 수 없는 정보예요.">
      <dl className="mt-sm space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="shrink-0 text-caption text-text-secondary">{row.label}</dt>
            <dd className="truncate text-caption font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </SettingsCard>
  )
}

const WITHDRAW_ITEMS = ['프로필과 계정 정보', '지난 대화와 메시지', '보낸 문의 내역']

interface WithdrawCardProps {
  password: string
  onPasswordChange: (value: string) => void
  /** 비밀번호 칸 아래 에러 문구 (있으면 빨간 테두리) */
  error?: string
  /** 탈퇴 요청 중 (버튼 로딩) */
  loading?: boolean
  /** "탈퇴하기" — 확인 팝업을 띄우는 쪽에서 처리해요 */
  onSubmit: () => void
  /** 카드 위 안내 (API 연동 전 목업 안내 등) */
  notice?: ReactNode
}

/** 회원탈퇴 카드 — 삭제되는 정보 + 비밀번호 확인 + 탈퇴하기 (Settings/Withdraw Card) */
export function WithdrawCard({
  password,
  onPasswordChange,
  error,
  loading = false,
  onSubmit,
  notice,
}: WithdrawCardProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="rounded-lg border border-border-subtle bg-bg-surface p-lg shadow-cloud-sm"
    >
      <h2 className="text-heading">회원탈퇴</h2>
      <p className="mt-sm text-caption text-text-secondary">탈퇴하면 아래 정보가 영구 삭제되고 되돌릴 수 없어요.</p>
      {notice && <div className="mt-sm">{notice}</div>}

      <p className="mt-sm text-caption text-text-secondary">삭제되는 정보</p>
      <ul className="mt-xs rounded-md border border-border-subtle px-md py-sm text-label">
        {WITHDRAW_ITEMS.map((item) => (
          <li key={item} className="leading-[22px]">
            · {item}
          </li>
        ))}
      </ul>

      <label htmlFor={inputId} className="mt-md block text-caption text-text-secondary">
        비밀번호 확인
      </label>
      <input
        id={inputId}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="현재 비밀번호를 입력해 주세요"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`mt-xs h-[46px] w-full rounded-md border bg-bg-surface px-md text-label transition outline-none placeholder:text-text-tertiary ${
          error ? 'border-border-danger' : 'border-border-subtle focus:border-border-brand'
        }`}
      />
      {error && (
        <FieldError id={errorId} className="mt-xs">
          {error}
        </FieldError>
      )}

      <div className="mt-md flex justify-end">
        <Button
          size="sm"
          type="submit"
          variant="danger"
          className="h-8! px-3! text-caption!"
          loading={loading}
          loadingText="탈퇴 중..."
        >
          탈퇴하기
        </Button>
      </div>
    </form>
  )
}

export type SettingsMenu = 'profile' | 'notification' | 'display' | 'contact' | 'about' | 'withdraw'

const SETTINGS_MENUS: { key: SettingsMenu; label: string; icon: LucideIcon }[] = [
  { key: 'profile', label: '개인 설정', icon: SlidersHorizontal },
  { key: 'notification', label: '알림', icon: Bell },
  { key: 'display', label: '화면', icon: Moon },
  { key: 'contact', label: '문의하기', icon: Mail },
  { key: 'about', label: '앱 정보', icon: Info },
]

interface SettingsNavProps {
  active: SettingsMenu
  onSelect: (menu: SettingsMenu) => void
  onLogout: () => void
}

/** 설정 화면 왼쪽 메뉴 (Web/Settings Nav) */
export function SettingsNav({ active, onSelect, onLogout }: SettingsNavProps) {
  const itemClass = 'flex h-10 w-full items-center gap-2.5 rounded-sm px-3 text-label transition'

  return (
    <nav aria-label="설정 메뉴" className="rounded-lg border border-border-subtle bg-bg-surface p-xs shadow-cloud-sm">
      <ul className="space-y-0.5">
        {SETTINGS_MENUS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`${itemClass} ${
                  isActive
                    ? 'bg-bg-brand-soft font-medium text-text-brand'
                    : 'text-text-secondary hover:bg-bg-canvas hover:text-text-primary'
                }`}
              >
                <Icon
                  className={`size-4 ${isActive ? 'text-icon-brand' : 'text-icon-muted'}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {label}
              </button>
            </li>
          )
        })}
        <li>
          <button type="button" onClick={onLogout} className={`${itemClass} text-text-danger hover:bg-bg-danger-soft`}>
            <LogOut className="size-4 text-icon-danger" strokeWidth={1.75} aria-hidden />
            로그아웃
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => onSelect('withdraw')}
            aria-current={active === 'withdraw' ? 'page' : undefined}
            className={`${itemClass} text-text-danger ${
              active === 'withdraw' ? 'bg-bg-brand-soft font-medium' : 'hover:bg-bg-danger-soft'
            }`}
          >
            <UserX className="size-4 text-icon-danger" strokeWidth={1.75} aria-hidden />
            회원탈퇴
          </button>
        </li>
      </ul>
    </nav>
  )
}
