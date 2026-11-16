import { useState, type FormEvent } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Icon, { type IconName } from '../../components/common/Icon'
import useProfile from '../../hooks/useProfile'
import logo from '../../assets/logo.svg'

// API 연동 전까지 설정값은 이 브라우저(localStorage)에만 저장한다.
const SETTINGS_STORAGE_KEY = 'hopes.settings'

type StoredSettings = {
  systemPrompt: string
  notifications: { answers: boolean; comments: boolean; announcements: boolean }
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

type SettingsSection = 'personal' | 'notifications' | 'display' | 'contact' | 'about'

const sections: { id: SettingsSection; label: string; icon: IconName }[] = [
  { id: 'personal', label: '개인 설정', icon: 'sliders' },
  { id: 'notifications', label: '알림', icon: 'bell' },
  { id: 'display', label: '화면', icon: 'moon' },
  { id: 'contact', label: '문의하기', icon: 'mail' },
  { id: 'about', label: '앱 정보', icon: 'info' },
]

function SettingsPage() {
  const { profile } = useProfile()
  const [initialSettings] = useState(loadSettings)
  const [activeSection, setActiveSection] = useState<SettingsSection>('personal')
  const [systemPrompt, setSystemPrompt] = useState(initialSettings.systemPrompt)
  const [notifications, setNotifications] = useState(initialSettings.notifications)
  const [email, setEmail] = useState(profile.email)
  const [message, setMessage] = useState('')
  const [contactErrors, setContactErrors] = useState({ email: false, message: false })
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(''), 2200)
  }

  function sendContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = {
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      message: !message.trim(),
    }
    setContactErrors(errors)
    if (errors.email || errors.message) return
    // TODO: 문의 API 연동 후 실제 전송 및 성공/실패 처리
    showToast('아직 문의 전송 기능이 준비 중이라 보내지 않았어요')
  }

  function saveSettings() {
    const saved = persistSettings({ systemPrompt, notifications })
    showToast(saved ? '설정을 이 기기에 저장했어요' : '설정을 저장하지 못했어요')
  }

  return (
    <AppLayout activeSection="settings">
      <main className="mx-auto w-full max-w-[1050px] px-5 pb-10 pt-5 md:px-8 md:pt-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight md:text-2xl">설정</h1>
            <p className="mt-1 text-sm text-sub">앱 설정과 도움말을 관리해요.</p>
          </div>
          <button onClick={saveSettings} className="h-9 rounded-lg border border-line bg-white px-4 text-xs font-medium text-brand transition hover:bg-[#f7f9fc]">저장</button>
        </header>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="rounded-[20px] border border-[#edf1f8] bg-white p-2 shadow-[0_5px_16px_rgba(37,56,95,0.06)]">
            <nav aria-label="설정 메뉴" className="space-y-1">
              {sections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)} aria-current={activeSection === section.id ? 'page' : undefined} className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs transition ${activeSection === section.id ? 'bg-[#eaf0fd] font-medium text-brand' : 'text-sub hover:bg-[#f7f9fc]'}`}>
                  <Icon name={section.icon} className="size-4" />{section.label}
                </button>
              ))}
              <button onClick={() => setLogoutOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-error transition hover:bg-[#fbf0f1]"><Icon name="logout" className="size-4" />로그아웃</button>
            </nav>
          </aside>

          <section className="min-h-[300px] rounded-[20px] border border-[#edf1f8] bg-white p-5 shadow-[0_5px_16px_rgba(37,56,95,0.06)] md:p-6">
            {activeSection === 'personal' && (
              <div>
                <h2 className="text-base font-semibold">시스템 프롬프트</h2>
                <p className="mt-2 text-xs text-sub">AI 응답을 만들 때 반영돼요. 비워두면 기본 스타일로 답해요.</p>
                <textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} className="mt-4 h-40 w-full resize-none rounded-xl border border-line p-3 text-sm text-ink outline-none focus:border-focus" />
                <div className="mt-3 flex justify-end"><button onClick={saveSettings} className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover">프롬프트 저장</button></div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-base font-semibold">알림</h2>
                <div className="mt-4 divide-y divide-[#edf0f5]">
                  <SettingToggle title="새 답변 알림" description="선배 답변이 도착하면 알려드려요." checked={notifications.answers} onChange={(checked) => setNotifications((current) => ({ ...current, answers: checked }))} />
                  <SettingToggle title="커뮤니티 댓글 알림" description="내 글에 댓글이 달리면 알려드려요." checked={notifications.comments} onChange={(checked) => setNotifications((current) => ({ ...current, comments: checked }))} />
                  <SettingToggle title="공지 알림" description="서비스 공지를 알려드려요." checked={notifications.announcements} onChange={(checked) => setNotifications((current) => ({ ...current, announcements: checked }))} />
                </div>
                <div className="mt-3 border-t border-[#edf0f5] pt-2"><h3 className="mb-1 pt-2 text-sm font-semibold">화면</h3><SettingToggle title="다크 모드" description="다크 모드는 준비 중이에요." checked={false} disabled badge="준비 중" onChange={() => {}} /></div>
              </div>
            )}

            {activeSection === 'display' && (
              <div>
                <h2 className="text-base font-semibold">화면</h2>
                <p className="mt-2 text-xs text-sub">화면 표시 방식을 설정해요.</p>
                <div className="mt-4"><SettingToggle title="다크 모드" description="다크 모드는 준비 중이에요." checked={false} disabled badge="준비 중" onChange={() => {}} /></div>
              </div>
            )}

            {activeSection === 'contact' && (
              <form onSubmit={sendContact} noValidate>
                <h2 className="text-base font-semibold">문의하기</h2>
                <p className="mt-2 text-xs text-sub">서비스 오류나 개선 의견을 보내주세요.</p>
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#f7f9fc] px-3 py-2 text-xs text-sub"><Icon name="info" className="size-3.5 shrink-0" />문의 전송 기능은 준비 중이에요. 지금은 작성해도 전송되지 않아요.</p>
                <label className="mt-4 block text-xs text-sub">답변 받을 이메일
                  <input value={email} onChange={(event) => { setEmail(event.target.value); setContactErrors((current) => ({ ...current, email: false })) }} className={`mt-1.5 h-11 w-full rounded-xl border px-3 text-sm text-ink outline-none focus:border-focus ${contactErrors.email ? 'border-error' : 'border-line'}`} />
                </label>
                {contactErrors.email && <p className="mt-1 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />이메일 형식이 올바르지 않아요.</p>}
                <label className="mt-3 block text-xs text-sub">문의 내용
                  <textarea value={message} onChange={(event) => { setMessage(event.target.value); setContactErrors((current) => ({ ...current, message: false })) }} rows={5} placeholder="예: 답변이 너무 짧게 나와요." className={`mt-1.5 w-full resize-none rounded-xl border p-3 text-sm text-ink outline-none placeholder:text-[#9aa4ba] focus:border-focus ${contactErrors.message ? 'border-error' : 'border-line'}`} />
                </label>
                {contactErrors.message && <p className="mt-1 flex items-center gap-1 text-xs text-error"><Icon name="alert" className="size-3.5" />문의 내용을 입력해 주세요.</p>}
                <div className="mt-3 flex justify-end"><button type="submit" className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover">문의 보내기</button></div>
              </form>
            )}

            {activeSection === 'about' && (
              <div>
                <div className="flex items-center gap-3 border-b border-[#edf0f5] pb-4">
                  <img src={logo} alt="hopes" className="size-12 rounded-xl border border-line p-2" />
                  <div><h2 className="text-sm font-semibold">hopes</h2><p className="mt-1 text-xs text-sub">버전 1.5 · 최신 버전 사용 중</p></div>
                </div>
                <div className="divide-y divide-[#edf0f5]">
                  {['이용약관', '개인정보 처리방침', '오픈소스 라이선스'].map((item) => <button key={item} onClick={() => showToast(`${item} 화면은 준비 중이에요`)} className="flex h-14 w-full items-center justify-between text-left text-xs text-ink"><span>{item}</span><Icon name="chevron-right" className="size-4 text-[#9aa4ba]" /></button>)}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {logoutOpen && <ConfirmDialog title="로그아웃할까요?" description="다시 로그인하면 대화 기록을 그대로 볼 수 있어요." cancelLabel="취소" confirmLabel="로그아웃" onCancel={() => setLogoutOpen(false)} onConfirm={() => { setLogoutOpen(false); showToast('로그아웃은 화면 목업입니다') }} />}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#202432] px-4 py-2.5 text-xs text-white shadow-lg">{toast}</div>}
    </AppLayout>
  )
}

function SettingToggle({ title, description, checked, onChange, disabled = false, badge }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; badge?: string }) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-ink">{title}{badge && <span className="rounded-full bg-[#f2f4f8] px-1.5 py-0.5 text-[10px] font-medium text-sub">{badge}</span>}</h3>
        <p className="mt-1 text-xs text-sub">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={title} disabled={disabled} onClick={() => onChange(!checked)} className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-[#dce2ed]'}`}>
        <span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function ConfirmDialog({ title, description, cancelLabel, confirmLabel, onCancel, onConfirm }: { title: string; description: string; cancelLabel: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#161b2b]/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <section role="alertdialog" aria-modal="true" className="w-full max-w-[300px] rounded-[20px] bg-white p-5 text-center shadow-2xl">
        <h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-xs text-sub">{description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={onCancel} className="h-9 rounded-lg border border-line text-xs">{cancelLabel}</button><button onClick={onConfirm} className="h-9 rounded-lg bg-[#fbf0f1] text-xs font-medium text-error">{confirmLabel}</button></div>
      </section>
    </div>
  )
}

export default SettingsPage