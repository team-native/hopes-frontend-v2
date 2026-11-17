import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, logout } from '../../api/auth'
import { getSettings, sendInquiry, updateSettings } from '../../api/settings'
import {
  getRecommendationConsent,
  setRecommendationConsent as saveRecommendationConsent,
} from '../../api/recommendations'
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
import TextField from '../../components/common/TextField'
import useProfile from '../../hooks/useProfile'
import useConversations from '../../hooks/useConversations'
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
  const navigate = useNavigate()
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
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteChatsOpen, setDeleteChatsOpen] = useState(false)
  const [accountPassword, setAccountPassword] = useState('')
  const [settingsError, setSettingsError] = useState(false)
  const [recommendationConsent, setRecommendationConsent] = useState(false)
  const [consentPolicyVersion, setConsentPolicyVersion] = useState('')
  const { deleteAllConversations } = useConversations()

  useEffect(() => {
    let active = true
    getSettings()
      .then((settings) => {
        if (!active) return
        setSystemPrompt(settings.customPrompt)
      })
      .catch(() => {
        if (active) setSettingsError(true)
      })
    getRecommendationConsent()
      .then((consent) => {
        if (!active) return
        setRecommendationConsent(consent.enabled)
        setConsentPolicyVersion(consent.policyVersion)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  async function changeRecommendationConsent(enabled: boolean) {
    if (!consentPolicyVersion) {
      showToast('추천 동의 정보를 불러오지 못했어요. 다시 시도해 주세요.')
      return
    }
    try {
      const consent = await saveRecommendationConsent(enabled, consentPolicyVersion)
      setRecommendationConsent(consent.enabled)
      setConsentPolicyVersion(consent.policyVersion)
    } catch {
      showToast('추천 설정을 저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  async function saveSettings() {
    const saved = persistSettings({ systemPrompt, notifications })
    if (!saved) {
      showToast('설정을 저장하지 못했어요')
      return
    }
    try {
      await updateSettings({ customPrompt: systemPrompt, deleteAllChats: false })
      showToast('설정을 저장했어요')
    } catch {
      showToast('서버에 설정을 저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  async function sendContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = { email: !EMAIL_PATTERN.test(email.trim()), message: !message.trim() }
    setContactErrors(errors)
    if (errors.email || errors.message) return
    try {
      await sendInquiry(`회신 이메일: ${email.trim()}\n\n${message.trim()}`)
      setMessage('')
      showToast('문의를 보냈어요')
    } catch {
      showToast('문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
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
                <section className="rounded-lg border border-border-subtle bg-bg-surface px-md shadow-cloud-sm">
                  <SettingToggleRow
                    title="개인화 질문 추천"
                    description="학과·전공 설정을 질문 추천에 활용해요."
                    checked={recommendationConsent}
                    onChange={(enabled) => void changeRecommendationConsent(enabled)}
                  />
                </section>
                {settingsError && <NoticeRow message="서버 설정을 불러오지 못했어요. 저장 시 다시 시도해 주세요." />}
                <AccountCard
                  rows={[
                    { label: '이름', value: profile.name },
                    { label: '학과', value: profile.department },
                    { label: '기수', value: profile.generation },
                    { label: '이메일', value: profile.email },
                  ]}
                />
                <Button variant="secondary" className="text-text-danger" onClick={() => setDeleteChatsOpen(true)}>
                  모든 대화 기록 삭제
                </Button>
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
                <Button variant="secondary" className="text-text-danger" onClick={() => setDeleteAccountOpen(true)}>
                  회원 탈퇴
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={deleteChatsOpen}
        title="모든 대화 기록을 삭제할까요?"
        description="모든 대화와 메시지가 영구 삭제돼요."
        confirmText="모두 삭제"
        tone="danger"
        onCancel={() => setDeleteChatsOpen(false)}
        onConfirm={async () => {
          try {
            await deleteAllConversations()
            setDeleteChatsOpen(false)
            showToast('모든 대화 기록을 삭제했어요')
          } catch {
            showToast('대화 기록을 삭제하지 못했어요. 다시 시도해 주세요.')
          }
        }}
      />
      <ConfirmDialog
        open={logoutOpen}
        title="로그아웃할까요?"
        description="다시 로그인하면 대화 기록을 그대로 볼 수 있어요."
        confirmText="로그아웃"
        tone="danger"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false)
          try {
            await logout()
          } catch {
            // The local session is cleared even when the server cannot be reached.
          } finally {
            navigate('/login', { replace: true })
          }
        }}
      />
      <ConfirmDialog
        open={deleteAccountOpen}
        title="계정을 탈퇴할까요?"
        description={
          <div className="space-y-sm">
            <p>계정과 대화, 메시지, 문의가 영구 삭제돼요.</p>
            <TextField
              label="비밀번호 확인"
              type="password"
              value={accountPassword}
              onChange={(event) => setAccountPassword(event.target.value)}
            />
          </div>
        }
        confirmText="탈퇴"
        tone="danger"
        onCancel={() => {
          setDeleteAccountOpen(false)
          setAccountPassword('')
        }}
        onConfirm={async () => {
          try {
            await deleteAccount(accountPassword)
            setDeleteAccountOpen(false)
            setAccountPassword('')
            navigate('/login', { replace: true })
          } catch {
            showToast('회원 탈퇴를 완료하지 못했어요. 비밀번호를 확인해 주세요.')
          }
        }}
      />
      <Toast message={toast} />
    </AppLayout>
  )
}

export default SettingsPage
