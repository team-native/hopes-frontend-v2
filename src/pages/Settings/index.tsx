import { useState, type FormEvent } from 'react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FieldError from '../../components/common/FieldError'
import { ListCard, ListRow } from '../../components/common/ListRow'
import LogoMark from '../../components/common/LogoMark'
import Toast from '../../components/common/Toast'
import { NoticeRow } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import {
  AccountCard,
  ContactCard,
  PromptCard,
  SettingsNav,
  type SettingsMenu,
} from '../../components/settings/SettingsCards'
import SettingToggleRow from '../../components/settings/SettingToggleRow'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'

// API 연동 전까지 설정값은 이 브라우저(localStorage)에만 저장한다.
const SETTINGS_STORAGE_KEY = 'hopes.settings'

type NotificationSettings = { answers: boolean; comments: boolean; announcements: boolean }

type StoredSettings = {
  systemPrompt: string
  notifications: NotificationSettings
}

const defaultSettings: StoredSettings = {
  systemPrompt: '답변은 3문장 이내로 짧게, 예시를 하나씩 들어줘.',
  notifications: { answers: true, comments: true, announcements: false },
}

function loadSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<StoredSettings>
    return {
      systemPrompt: typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : defaultSettings.systemPrompt,
      notifications: { ...defaultSettings.notifications, ...parsed.notifications },
    }
  } catch {
    return defaultSettings
  }
}

function persistSettings(settings: StoredSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

/** 문의 답변을 받을 이메일 (학교 메일이 아니어도 돼요) */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const NOTIFICATION_ITEMS: { key: keyof NotificationSettings; title: string; description: string }[] = [
  { key: 'answers', title: '새 답변 알림', description: '선배 답변이 도착하면 알려드려요.' },
  { key: 'comments', title: '커뮤니티 댓글 알림', description: '내 글에 댓글이 달리면 알려드려요.' },
  { key: 'announcements', title: '공지 알림', description: '서비스 공지를 알려드려요.' },
]

function SettingsPage() {
  const { profile } = useProfile()
  const { toast, showToast } = useToast()
  const [initialSettings] = useState(loadSettings)
  const [activeMenu, setActiveMenu] = useState<SettingsMenu>('profile')
  const [systemPrompt, setSystemPrompt] = useState(initialSettings.systemPrompt)
  const [notifications, setNotifications] = useState(initialSettings.notifications)
  const [email, setEmail] = useState(profile.email)
  const [message, setMessage] = useState('')
  const [contactErrors, setContactErrors] = useState({ email: false, message: false })
  const [logoutOpen, setLogoutOpen] = useState(false)

  function saveSettings() {
    const saved = persistSettings({ systemPrompt, notifications })
    showToast(saved ? '설정을 이 기기에 저장했어요' : '설정을 저장하지 못했어요')
  }

  function sendContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = { email: !EMAIL_PATTERN.test(email.trim()), message: !message.trim() }
    setContactErrors(errors)
    if (errors.email || errors.message) return
    // TODO: 문의 API 연동 후 실제 전송 및 성공/실패 처리
    showToast('아직 문의 전송 기능이 준비 중이라 보내지 않았어요')
  }

  return (
    <AppLayout activeMenu={null}>
      <main className="mx-auto w-full max-w-[1050px] px-5 pt-5 pb-10 md:px-8 md:pt-6">
        <header className="mb-xl flex items-start justify-between gap-md">
          <div>
            <h1 className="text-title">설정</h1>
            <p className="mt-1 text-label text-text-secondary">앱 설정과 도움말을 관리해요.</p>
          </div>
          {(activeMenu === 'profile' || activeMenu === 'notification') && (
            <Button size="sm" onClick={saveSettings}>
              저장
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 items-start gap-md md:grid-cols-[220px_minmax(0,1fr)]">
          <SettingsNav active={activeMenu} onSelect={setActiveMenu} onLogout={() => setLogoutOpen(true)} />

          <div className="space-y-md">
            {activeMenu === 'profile' && (
              <>
                <PromptCard value={systemPrompt} onChange={setSystemPrompt} />
                <AccountCard
                  rows={[
                    { label: '이름', value: profile.name },
                    { label: '학과', value: profile.department },
                    { label: '기수', value: profile.generation },
                    { label: '이메일', value: profile.email },
                  ]}
                />
              </>
            )}

            {activeMenu === 'notification' && (
              <ListCard className="px-md">
                {NOTIFICATION_ITEMS.map((item) => (
                  <li key={item.key}>
                    <SettingToggleRow
                      title={item.title}
                      description={item.description}
                      checked={notifications[item.key]}
                      onChange={(checked) => setNotifications((current) => ({ ...current, [item.key]: checked }))}
                    />
                  </li>
                ))}
              </ListCard>
            )}

            {activeMenu === 'display' && (
              <ListCard className="px-md">
                <li>
                  <SettingToggleRow
                    title="다크 모드"
                    description="다크 모드는 준비 중이에요."
                    badge="준비 중"
                    checked={false}
                    disabled
                    onChange={() => {}}
                  />
                </li>
              </ListCard>
            )}

            {activeMenu === 'contact' && (
              <form onSubmit={sendContact} noValidate className="space-y-sm">
                <NoticeRow message="문의 전송 기능은 준비 중이에요. 지금은 작성해도 전송되지 않아요." />
                <ContactCard
                  email={email}
                  message={message}
                  onEmailChange={(value) => {
                    setEmail(value)
                    setContactErrors((current) => ({ ...current, email: false }))
                  }}
                  onMessageChange={(value) => {
                    setMessage(value)
                    setContactErrors((current) => ({ ...current, message: false }))
                  }}
                />
                {contactErrors.email && <FieldError>이메일 형식이 올바르지 않아요.</FieldError>}
                {contactErrors.message && <FieldError>문의 내용을 입력해 주세요.</FieldError>}
                <div className="flex justify-end">
                  <Button size="sm" type="submit">
                    문의 보내기
                  </Button>
                </div>
              </form>
            )}

            {activeMenu === 'about' && (
              <>
                <section className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
                  <LogoMark size={48} />
                  <div>
                    <h2 className="text-label-strong">hopes</h2>
                    <p className="mt-0.5 text-caption text-text-secondary">버전 1.5 · 최신 버전 사용 중</p>
                  </div>
                </section>
                <ListCard className="px-md">
                  {['이용약관', '개인정보 처리방침', '오픈소스 라이선스'].map((item) => (
                    <ListRow
                      key={item}
                      title={item}
                      onClick={() => showToast(`${item} 화면은 준비 중이에요`)}
                      trailing={<Badge>준비 중</Badge>}
                    />
                  ))}
                </ListCard>
              </>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={logoutOpen}
        title="로그아웃할까요?"
        description="다시 로그인하면 대화 기록을 그대로 볼 수 있어요."
        confirmText="로그아웃"
        tone="danger"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false)
          // TODO: 로그인 연동 후 실제 로그아웃 처리
          showToast('로그아웃은 아직 준비 중이에요')
        }}
      />
      <Toast message={toast} />
    </AppLayout>
  )
}

export default SettingsPage
