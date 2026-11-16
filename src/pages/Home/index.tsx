import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { PDFDocumentLoadingTask } from 'pdfjs-dist'
import AppLayout from '../../components/layout/AppLayout'
import Icon, { type IconName } from '../../components/common/Icon'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import type { Conversation, LocalAttachment } from '../../types/conversation'
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_COUNT, canDisplayImage, checkAttachmentFile, matchesFileSignature } from '../../utils/attachments'
import type { Profile } from '../../types/profile'
import logo from '../../assets/logo.svg'

const popularQuestions = [
  { title: '전공 동아리 면접 후기 공유', meta: '전체 · ♡ 34' },
  { title: '취업 준비 언제부터 시작했어?', meta: '9기 · ♡ 21' },
  { title: '기숙사 와이파이 다들 잘 돼?', meta: '10기 · ♡ 12' },
]

const suggestedQuestions: { title: string; category: string; icon: IconName }[] = [
  { title: '기숙사 하루 일과가 어떻게 돼?', category: '학교생활', icon: 'bed' },
  { title: '입학하려면 뭘 준비해야 해?', category: '입학', icon: 'file' },
  { title: 'Frontend는 뭐부터 공부하면 좋아?', category: '전공 · Frontend', icon: 'code' },
  { title: '후배한테 해주고 싶은 조언 있어?', category: '학교생활', icon: 'heart' },
]

type MockAnswer = {
  category: string
  heading: string
  body: string
  steps?: string[]
  bullets?: string[]
  code?: string
  reference?: string
  citation?: string
  locationActions?: boolean
}

const mockAnswers = {
  dorm: {
    category: '학교생활',
    heading: '기숙사 하루 일과',
    body: '평일에는 기상 후 아침 식사와 수업을 하고, 방과 후에는 저녁 식사와 자율 학습 시간을 보내요. 이후 점호를 마치고 정해진 시간에 취침하는 흐름이에요. 세부 시간은 학년이나 기숙사 운영 일정에 따라 달라질 수 있어요.',
    steps: ['기상 및 아침 식사', '정규 수업과 방과 후 일정', '저녁 식사와 자율 학습', '점호 후 취침'],
  },
  frontend: {
    category: '전공 공부',
    heading: 'Frontend 시작 순서',
    body: '처음에는 화면을 직접 만들어 보는 것부터 시작하는 걸 추천해요. HTML·CSS로 간단한 페이지를 만들고, JavaScript 기초 문법을 익힌 뒤 작은 프로젝트를 완성해 보세요.',
    steps: ['HTML·CSS로 간단한 페이지 만들기', 'JavaScript 기초 문법 익히기', 'React로 작은 프로젝트 완성하기'],
    code: '<button class="primary">질문하기</button>',
    reference: '학교 전공 소개 페이지 보기',
  },
  admission: {
    category: '입학',
    heading: '입학 준비 체크리스트',
    body: '모집 요강과 전형 일정을 먼저 확인하고, 필요한 서류와 평가 항목을 정리해 두세요. 전형 내용은 해마다 달라질 수 있으니 학교의 최신 안내를 기준으로 준비하는 게 좋아요.',
    steps: ['최신 모집 요강 확인하기', '전형 일정과 제출 서류 정리하기', '학교 공식 안내에서 변경 사항 확인하기'],
  },
  club: {
    category: '학교생활',
    heading: '동아리 선택과 면접 준비',
    body: '관심 있는 분야와 동아리 활동 내용을 먼저 살펴보세요. 면접에서는 지원한 이유와 해보고 싶은 활동을 구체적으로 이야기할 수 있도록 정리해 두면 도움이 돼요.',
    steps: ['동아리별 활동 내용 찾아보기', '관심 분야와 지원 동기 정리하기', '해보고 싶은 활동을 구체적으로 준비하기'],
  },
  fallback: {
    category: '선배 답변',
    heading: '예시 답변',
    body: '현재는 화면 확인을 위한 목업 답변만 제공하고 있어요. 실제 질문에 맞는 답변은 서버 연동 후 표시됩니다.',
  },
  attachment: {
    category: '자료 첨부',
    heading: '첨부 자료 확인',
    body: '파일은 대화에 첨부했어요. 실제 파일 내용을 읽고 요약하는 기능은 서버 연결 후 사용할 수 있습니다.',
  },
  dormRules: {
    category: '자료 요약',
    heading: '외출 규정 요약',
    body: '생활수칙 자료에 포함된 외출 관련 예시 요약입니다.',
    bullets: ['평일 외출은 사감 선생님 승인 후 가능해요.', '주말 외출은 금요일까지 신청해야 해요.', '복귀 시간은 일요일 저녁 9시예요.'],
  },
  location: {
    category: '학교 생활',
    heading: '현재 위치 확인은 hopes 앱에서만 할 수 있어요',
    body: '웹에서는 학교 지도와 건물 정보를 안내해 드려요.',
    locationActions: true,
  },
} satisfies Record<string, MockAnswer>

function getMockAnswer(question: string): MockAnswer {
  const normalizedQuestion = question.toLowerCase()

  if (/위치|어디야|어디 있/.test(normalizedQuestion)) return mockAnswers.location
  if (/기숙사|하루 일과|와이파이|외출/.test(normalizedQuestion)) return mockAnswers.dorm
  if (/입학|준비/.test(normalizedQuestion)) return mockAnswers.admission
  if (/동아리/.test(normalizedQuestion)) return mockAnswers.club
  if (/frontend|프론트|전공 공부|공부/.test(normalizedQuestion)) return mockAnswers.frontend
  return mockAnswers.fallback
}

function getAttachmentAnswer(attachments: LocalAttachment[]): MockAnswer {
  const pdfAttachment = attachments.find(({ format }) => format === 'pdf')
  const reference = pdfAttachment?.file.name ?? attachments[0].file.name
  const answer = /생활수칙|생활규정|외출/.test(reference) ? mockAnswers.dormRules : mockAnswers.attachment
  const pages = pdfAttachment?.pageCount ? ` · 1-${pdfAttachment.pageCount}쪽 기반` : ' · 첨부 자료 기반'
  return { ...answer, citation: `${reference}${pages}` }
}

const RECENT_CONVERSATION_COUNT = 3

type HomeScreen = 'home' | 'chat' | 'conversation'

function HomePage() {
  // 화면 상태는 URL에서 매 렌더마다 계산한다. (/ → 홈, /chat → 새 대화, /chat/:conversationId → 대화)
  const { conversationId } = useParams()
  const { pathname } = useLocation()
  const screen: HomeScreen = conversationId ? 'conversation' : pathname.startsWith('/chat') ? 'chat' : 'home'

  const { goToSection, startNewChat, openConversation } = useAppNavigation()
  const { conversations, getConversation, createConversation } = useConversations()
  const { profile } = useProfile()
  const conversation = conversationId ? getConversation(conversationId) : undefined

  const [draft, setDraft] = useState('')
  const [department, setDepartment] = useState('소프트웨어개발과')
  const [major, setMajor] = useState('Frontend')
  const [openFilter, setOpenFilter] = useState<'department' | 'major' | null>(null)
  const [toast, setToast] = useState('')

  function startConversation(question: string, attachments: LocalAttachment[] = []) {
    const id = createConversation(question, attachments)
    setDraft('')
    openConversation(id)
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  /** 질문을 받아 새 대화를 만들었으면 true. 첨부는 이때 대화로 소유권이 넘어간다. */
  function submitQuestion(event: FormEvent<HTMLFormElement>, attachments: LocalAttachment[] = [], questionOverride = draft) {
    event.preventDefault()
    const question = questionOverride.trim() || (attachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!question) return false
    startConversation(question, attachments)
    return true
  }

  return (
    <AppLayout
      activeSection={screen === 'home' ? 'home' : 'chat'}
      activeConversationId={conversation?.id}
    >
      {screen === 'home' ? (
        <HomeView
          profile={profile}
          recentConversations={conversations.slice(0, RECENT_CONVERSATION_COUNT)}
          onStartChat={startNewChat}
          onOpenConversation={openConversation}
          onOpenQuestion={startConversation}
          onShowHistory={() => goToSection('history')}
          onNotify={() => showToast('새로운 알림이 없어요.')}
        />
      ) : screen === 'chat' ? (
        <NewChatView
          department={department}
          major={major}
          openFilter={openFilter}
          onFilterToggle={setOpenFilter}
          onDepartmentChange={setDepartment}
          onMajorChange={setMajor}
          onOpenQuestion={startConversation}
          onShowHistory={() => goToSection('history')}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuestion}
        />
      ) : conversation ? (
        <ConversationView
          key={conversation.id}
          title={conversation.title}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuestion}
          onToast={showToast}
          attachments={conversation.attachments ?? []}
        />
      ) : (
        <ConversationNotFound onNewChat={startNewChat} onShowHistory={() => goToSection('history')} />
      )}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#202432] px-4 py-2.5 text-xs text-white shadow-lg">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary"><Icon name="alert" className="size-3" /></span>
          {toast}
        </div>
      )}
    </AppLayout>
  )
}

type HomeViewProps = {
  profile: Profile
  recentConversations: Conversation[]
  onStartChat: () => void
  onOpenConversation: (conversationId: string) => void
  onOpenQuestion: (question: string) => void
  onShowHistory: () => void
  onNotify: () => void
}

function HomeView({ profile, recentConversations, onStartChat, onOpenConversation, onOpenQuestion, onShowHistory, onNotify }: HomeViewProps) {
  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 pb-10 pt-5 md:px-8 md:pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold leading-tight md:text-2xl"><span className="text-brand">안녕하세요,</span> {profile.name}님</h1>
          <p className="mt-1 text-sm text-sub">{profile.department} · {profile.generation}</p>
        </div>
        <button onClick={onNotify} aria-label="알림" className="flex size-10 items-center justify-center rounded-xl bg-white text-sub shadow-[0_3px_12px_rgba(26,42,78,0.08)] transition hover:text-primary">
          <Icon name="bell" />
        </button>
      </header>

      <section className="mx-auto mb-4 max-w-[854px] overflow-hidden rounded-[22px] border border-[#edf1f8] bg-[radial-gradient(ellipse_at_100%_100%,rgba(95,134,239,0.17),transparent_30%),linear-gradient(110deg,#fff_15%,#f1f5ff_100%)] px-6 py-6 shadow-[0_5px_18px_rgba(37,56,95,0.06)] md:px-7 md:py-6">
        <h2 className="max-w-md text-[22px] font-bold leading-[1.4] md:text-2xl"><span className="text-brand">선배</span>에게 묻는<br /><span className="text-brand">가장 솔직한</span> 학교 이야기</h2>
        <p className="mt-2 text-sm text-sub">기숙사, 전공, 취업 질문에 선배 경험으로 답해요.</p>
        <button onClick={onStartChat} className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover">채팅 시작하기</button>
      </section>

      <div className="mx-auto grid max-w-[854px] grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr]">
        <ListPanel title="이어서 하기" action="더보기" onAction={onShowHistory}>
          {recentConversations.length === 0 && <p className="py-4 text-xs text-sub">아직 대화가 없어요.</p>}
          {recentConversations.map((item) => (
            <button key={item.id} onClick={() => onOpenConversation(item.id)} className="flex min-h-[50px] w-full items-center justify-between gap-3 border-b border-[#edf0f5] text-left last:border-0">
              <span className="truncate text-sm">{item.title}</span><span className="shrink-0 text-xs text-[#9aa4ba]">{item.age}</span>
            </button>
          ))}
        </ListPanel>
        <ListPanel title="커뮤니티 인기글" action="더보기" onAction={() => onOpenQuestion(popularQuestions[0].title)}>
          {popularQuestions.map((item) => (
            <button key={item.title} onClick={() => onOpenQuestion(item.title)} className="flex min-h-[50px] w-full items-center justify-between gap-3 border-b border-[#edf0f5] text-left last:border-0">
              <span className="truncate text-sm">{item.title}</span><span className="shrink-0 text-xs text-[#9aa4ba]">{item.meta}</span>
            </button>
          ))}
        </ListPanel>
        <section className="rounded-[21px] border border-[#edf1f8] bg-white p-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)] md:col-span-2 xl:col-span-1">
          <h2 className="mb-4 text-xs font-medium text-sub">질문 잘하는 방법</h2>
          <div className="space-y-4">
            <Tip number="1" detail="질문 전에," title="학과·전공을 먼저 골라요" />
            <Tip number="2" detail="‘기숙사 하루’ 보다," title="‘1학년 기숙사 평일 루틴 알려줘’" />
          </div>
        </section>
      </div>
    </main>
  )
}

type ListPanelProps = {
  title: string
  action: string
  onAction: () => void
  children: React.ReactNode
}

function ListPanel({ title, action, onAction, children }: ListPanelProps) {
  return (
    <section className="rounded-[21px] border border-[#edf1f8] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(37,56,95,0.06)]">
      <header className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-medium text-sub">{title}</h2>
        <button onClick={onAction} className="text-xs font-medium text-brand hover:underline">{action}</button>
      </header>
      {children}
    </section>
  )
}

function Tip({ number, detail, title }: { number: string; detail: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-xs font-medium text-brand">{number}</span>
      <p className="text-xs leading-5 text-sub">{detail}<br /><strong className="font-semibold text-ink">{title}</strong></p>
    </div>
  )
}

type NewChatViewProps = {
  department: string
  major: string
  openFilter: 'department' | 'major' | null
  onFilterToggle: (filter: 'department' | 'major' | null) => void
  onDepartmentChange: (value: string) => void
  onMajorChange: (value: string) => void
  onOpenQuestion: (question: string) => void
  onShowHistory: () => void
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function NewChatView({ department, major, openFilter, onFilterToggle, onDepartmentChange, onMajorChange, onOpenQuestion, onShowHistory, draft, onDraftChange, onSubmit }: NewChatViewProps) {
  const departments = ['소프트웨어개발과', '스마트IoT과', '인공지능과']
  const majors = ['Frontend', 'Backend', 'AI']

  return (
    <main className="flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pb-4 pt-5 md:min-h-screen md:px-8 md:pt-5">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold md:text-2xl">새 대화</h1>
        <div className="flex items-center gap-2">
          <FilterMenu label={department} menu="department" value={department} values={departments} openFilter={openFilter} onToggle={onFilterToggle} onChange={onDepartmentChange} />
          <FilterMenu label={major} menu="major" value={major} values={majors} openFilter={openFilter} onToggle={onFilterToggle} onChange={onMajorChange} />
          <button onClick={onShowHistory} className="hidden rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-brand sm:block">대화 기록</button>
        </div>
      </header>

      <section className="mx-auto mt-10 w-full max-w-[654px] text-center md:mt-12">
        <h2 className="text-[30px] font-bold leading-tight md:text-[36px]">무엇이 <span className="text-brand">궁금한</span>가요?</h2>
        <p className="mt-2 text-sm text-sub">광주소프트웨어마이스터고 선배에게 편하게 물어보세요.</p>
        <div className="mt-7 flex items-center justify-between text-left text-xs text-sub">
          <span>{department} · {major} 추천 질문</span>
          <button aria-label="추천 질문 새로고침" className="rounded-md p-1.5 text-[#9aa4ba] hover:bg-white hover:text-primary"><Icon name="refresh" className="size-4" /></button>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {suggestedQuestions.map((question) => (
            <button key={question.title} onClick={() => onOpenQuestion(question.title)} className="min-h-[112px] rounded-[19px] border border-[#edf1f8] bg-white p-4 text-left shadow-[0_5px_16px_rgba(37,56,95,0.06)] transition hover:-translate-y-0.5 hover:border-[#dbe5fb]">
              <span className="mb-2 flex size-8 items-center justify-center rounded-[10px] bg-[#edf3ff] text-primary"><Icon name={question.icon} className="size-[17px]" /></span>
              <span className="block text-sm font-semibold text-ink">{question.title}</span>
              <span className="mt-1.5 block text-xs text-[#9aa4ba]">{question.category}</span>
            </button>
          ))}
        </div>
      </section>

      <Composer draft={draft} onDraftChange={onDraftChange} onSubmit={onSubmit} placeholder="선배에게 메시지 보내기" />
      <p className="mt-2 text-center text-[11px] text-[#aab3c5]">선배 답변은 실제 응답 데이터를 바탕으로 한 참고용이에요.</p>
    </main>
  )
}

type FilterMenuProps = {
  label: string
  menu: 'department' | 'major'
  value: string
  values: string[]
  openFilter: 'department' | 'major' | null
  onToggle: (filter: 'department' | 'major' | null) => void
  onChange: (value: string) => void
}

function FilterMenu({ label, menu, value, values, openFilter, onToggle, onChange }: FilterMenuProps) {
  const isOpen = openFilter === menu
  return (
    <div className="relative">
      <button onClick={() => onToggle(isOpen ? null : menu)} aria-expanded={isOpen} className="flex items-center gap-1 rounded-full border border-[#cbd9fb] bg-[#edf3ff] px-3 py-2 text-[11px] font-medium text-brand">
        <span className="max-w-[108px] truncate">{label}</span><Icon name="chevron-down" className="size-3" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-2 min-w-[150px] rounded-xl border border-line bg-white p-1.5 shadow-lg">
          {values.map((option) => (
            <button key={option} onClick={() => { onChange(option); onToggle(null) }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${value === option ? 'bg-[#edf3ff] text-brand' : 'text-ink hover:bg-[#f6f8fb]'}`}>
              {option}{value === option && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type ComposerProps = {
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  placeholder: string
}

function Composer({ draft, onDraftChange, onSubmit, placeholder }: ComposerProps) {
  return (
    <form onSubmit={onSubmit} className="mx-auto mt-auto flex w-full max-w-[654px] items-center gap-3 rounded-full border border-[#edf1f8] bg-white p-2 pl-4 shadow-[0_6px_20px_rgba(37,56,95,0.1)]">
      <button type="button" aria-label="첨부" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5f8ff] text-primary"><Icon name="plus" className="size-[18px]" /></button>
      <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aab3c5]" aria-label={placeholder} />
      <button type="submit" disabled={!draft.trim()} aria-label="질문 보내기" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(95,134,239,0.25)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-[#9bb5f4]">
        <Icon name="arrow-up" className="size-[18px]" />
      </button>
    </form>
  )
}

type ConversationViewProps = {
  title: string
  draft: string
  attachments: LocalAttachment[]
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>, attachments: LocalAttachment[], question: string) => boolean
  onToast: (message: string) => void
}

function ConversationView({ title, draft, attachments, onDraftChange, onSubmit, onToast }: ConversationViewProps) {
  const answer: MockAnswer = attachments.length > 0 ? getAttachmentAnswer(attachments) : getMockAnswer(title)
  const [selectedAttachments, setSelectedAttachments] = useState<LocalAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [dropzoneOpen, setDropzoneOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 첨부 리소스 소유권: 전송 전까지는 이 컴포저가 소유하고, 제거·화면 종료 시 해제한다.
  // 전송하면 미리보기 URL의 소유권은 대화(ConversationProvider)로 넘어간다.
  const processingJobsRef = useRef(new Map<string, AbortController>())
  const ownedPreviewUrlsRef = useRef(new Map<string, string>())

  useEffect(() => {
    const jobs = processingJobsRef.current
    const previewUrls = ownedPreviewUrlsRef.current
    return () => {
      jobs.forEach((job) => job.abort())
      jobs.clear()
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.clear()
    }
  }, [])

  function updateAttachment(id: string, changes: Partial<LocalAttachment>) {
    setSelectedAttachments((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList)
    const checks = incomingFiles.map((file) => ({ file, check: checkAttachmentFile(file) }))
    const validFiles = checks.flatMap(({ file, check }) => (check.ok ? [{ file, format: check.format }] : []))
    const remainingSlots = Math.max(0, MAX_ATTACHMENT_COUNT - selectedAttachments.length)
    const acceptedFiles = validFiles.slice(0, remainingSlots)

    const newAttachments: LocalAttachment[] = acceptedFiles.map(({ file, format }) => {
      const id = crypto.randomUUID()
      // JPG·PNG는 모든 브라우저가 표시할 수 있어 바로 미리보기를 만든다. HEIC는 처리 단계에서 지원 여부를 확인한다.
      const previewUrl = format === 'jpeg' || format === 'png' ? URL.createObjectURL(file) : undefined
      if (previewUrl) ownedPreviewUrlsRef.current.set(id, previewUrl)
      return { id, file, format, status: 'processing', previewUrl }
    })
    setSelectedAttachments((current) => [...current, ...newAttachments])
    newAttachments.forEach((attachment) => {
      const job = new AbortController()
      processingJobsRef.current.set(attachment.id, job)
      void processAttachment(attachment, job.signal).finally(() => {
        if (processingJobsRef.current.get(attachment.id) === job) processingJobsRef.current.delete(attachment.id)
      })
    })

    if (checks.some(({ check }) => !check.ok && check.reason === 'type')) {
      setAttachmentError('이미지(JPG·PNG·HEIC)와 PDF만 첨부할 수 있어요.')
    } else if (checks.some(({ check }) => !check.ok && check.reason === 'size')) {
      setAttachmentError('파일당 최대 20MB까지 첨부할 수 있어요.')
    } else if (validFiles.length > remainingSlots) {
      setAttachmentError(`한 번에 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부할 수 있어요.`)
    } else {
      setAttachmentError('')
    }

    setDropzoneOpen(false)
  }

  // 브라우저 안에서만 하는 확인 작업이다. 서버 업로드는 하지 않는다.
  async function processAttachment(attachment: LocalAttachment, signal: AbortSignal) {
    const { id, file, format } = attachment
    let pdfTask: PDFDocumentLoadingTask | undefined
    const destroyPdfTask = () => { void pdfTask?.destroy().catch(() => undefined) }

    try {
      const signatureMatches = await matchesFileSignature(file, format)
      if (signal.aborted) return
      if (!signatureMatches) {
        updateAttachment(id, { status: 'error', error: '파일 내용이 형식과 맞지 않아요.' })
        return
      }

      if (format === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist')
        if (signal.aborted) return
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        const data = await file.arrayBuffer()
        if (signal.aborted) return
        pdfTask = pdfjsLib.getDocument({ data })
        signal.addEventListener('abort', destroyPdfTask, { once: true })
        const pdf = await pdfTask.promise
        if (signal.aborted) return
        updateAttachment(id, { status: 'ready', pageCount: pdf.numPages })
        return
      }

      if (format === 'heic') {
        const url = URL.createObjectURL(file)
        const displayable = await canDisplayImage(url)
        if (signal.aborted || !displayable) {
          URL.revokeObjectURL(url)
          if (!signal.aborted) updateAttachment(id, { status: 'ready', previewUnsupported: true })
          return
        }
        ownedPreviewUrlsRef.current.set(id, url)
        updateAttachment(id, { status: 'ready', previewUrl: url })
        return
      }

      updateAttachment(id, { status: 'ready' })
    } catch {
      if (signal.aborted) return
      updateAttachment(id, { status: 'error', error: format === 'pdf' ? 'PDF를 읽지 못했어요. 파일을 확인해 주세요.' : '파일을 읽지 못했어요.' })
    } finally {
      // 쪽수만 필요하므로 성공·실패·취소와 관계없이 PDF 문서와 워커 리소스를 정리한다.
      signal.removeEventListener('abort', destroyPdfTask)
      destroyPdfTask()
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) addFiles(event.currentTarget.files)
    event.currentTarget.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files)
  }

  function removeSelectedFile(id: string) {
    processingJobsRef.current.get(id)?.abort()
    processingJobsRef.current.delete(id)
    const previewUrl = ownedPreviewUrlsRef.current.get(id)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    ownedPreviewUrlsRef.current.delete(id)
    setSelectedAttachments((current) => current.filter((attachment) => attachment.id !== id))
    setAttachmentError('')
  }

  const hasUnreadyAttachment = selectedAttachments.some(({ status }) => status !== 'ready')
  const fileErrors = selectedAttachments.filter(({ format, error }) => format !== 'pdf' && error)
  const hasUnsupportedPreview = selectedAttachments.some(({ previewUnsupported }) => previewUnsupported)

  function handleConversationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasUnreadyAttachment) return
    const question = draft.trim() || (selectedAttachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!question) return

    const accepted = onSubmit(event, selectedAttachments, question)
    if (!accepted) return
    // 전송한 첨부의 미리보기 URL은 대화가 소유하므로 여기서는 해제하지 않고 소유 목록에서만 뺀다.
    processingJobsRef.current.clear()
    ownedPreviewUrlsRef.current.clear()
    setSelectedAttachments([])
    setAttachmentError('')
  }

  return (
    <main className="relative flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pb-4 pt-5 md:min-h-screen md:px-8 md:pt-5">
      <header className="flex items-start justify-between">
        <div><h1 className="text-xl font-bold md:text-2xl">{answer.category}</h1><p className="mt-1 text-xs text-sub">소프트웨어개발과 · {answer.category}</p></div>
        <button aria-label="대화 옵션" className="rounded-lg px-2 py-1 text-lg text-sub hover:bg-white">···</button>
      </header>
      <section className="mx-auto flex w-full max-w-[654px] flex-1 flex-col justify-end gap-4 py-8">
        {attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2" aria-label="전송한 첨부 파일">
            {attachments.map((attachment) => <AttachmentItem key={attachment.id} attachment={attachment} variant="sent" />)}
          </div>
        )}
        <div className="flex justify-end"><div className="max-w-[85%] rounded-[19px] rounded-br-md bg-primary px-4 py-3 text-sm text-white shadow-[0_6px_15px_rgba(95,134,239,0.2)]">{title}</div></div>
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e9eef8] bg-white text-primary shadow-sm"><img src={logo} alt="" className="size-5" /></span>
          <article className="min-w-0 flex-1 rounded-[19px] border border-[#edf1f8] bg-white p-4 shadow-[0_5px_16px_rgba(37,56,95,0.06)]">
            <h2 className="text-base font-semibold">{answer.heading}</h2>
            <p className="mt-2 text-sm leading-6 text-ink">{answer.body}</p>
            {answer.steps && (
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm marker:text-primary">
                {answer.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
            {answer.code && (
              <div className="mt-3 rounded-xl border border-[#edf1f8] bg-[#f7f9fc] p-3 text-xs text-sub">
                <div className="mb-2 flex items-center justify-between"><span>html</span><button onClick={() => onToast('코드를 복사했어요.')} className="flex items-center gap-1 hover:text-primary"><Icon name="copy" className="size-3.5" />복사</button></div>
                <code className="text-ink">{answer.code}</code>
              </div>
            )}
            {answer.reference && <a href="#school" onClick={(event) => event.preventDefault()} className="mt-3 inline-block text-xs text-brand underline">{answer.reference}</a>}
          </article>
        </div>
        <div className="flex gap-3 pl-11 text-xs text-[#9aa4ba]">
          <button onClick={() => onToast('답변을 복사했어요.')} className="flex items-center gap-1 hover:text-primary"><Icon name="copy" className="size-3.5" />복사</button>
          <button onClick={() => onToast('답변을 저장했어요.')} className="flex items-center gap-1 hover:text-primary"><Icon name="bookmark" className="size-3.5" />저장</button>
          <button onClick={() => onToast('공유 링크를 준비했어요.')} className="flex items-center gap-1 hover:text-primary"><Icon name="share" className="size-3.5" />공유</button>
        </div>
      </section>
      <form onSubmit={handleConversationSubmit} className="mx-auto w-full max-w-[654px] rounded-[20px] border border-[#edf1f8] bg-white p-3 shadow-[0_6px_20px_rgba(37,56,95,0.1)]">
        {attachmentError && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-[#fbf0f1] px-3 py-2.5 text-xs text-error">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            <span>{attachmentError}</span>
          </div>
        )}
        {selectedAttachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedAttachments.map((attachment) => (
              <AttachmentItem
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeSelectedFile(attachment.id)}
              />
            ))}
          </div>
        )}
        {selectedAttachments.length > 0 && (
          <div className="mb-3 space-y-1 text-[11px]">
            {fileErrors.map((attachment) => (
              <p key={attachment.id} className="flex items-center gap-1 text-error"><Icon name="alert" className="size-3.5 shrink-0" /><span className="truncate">{attachment.file.name} · {attachment.error}</span></p>
            ))}
            {hasUnsupportedPreview && <p className="flex items-center gap-1 text-sub"><Icon name="info" className="size-3.5 shrink-0" />이 브라우저에서는 HEIC 미리보기를 지원하지 않아요. 파일은 그대로 첨부돼요.</p>}
            <p className="flex items-center gap-1 text-[#9aa4ba]"><Icon name="info" className="size-3.5 shrink-0" />목업 단계라 첨부 파일은 서버로 업로드되지 않아요.</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="button" aria-label="자료 첨부" onClick={() => setDropzoneOpen(true)} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5f8ff] text-primary hover:bg-[#edf3ff]">
            <Icon name="plus" className="size-[18px]" />
          </button>
          <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder={selectedAttachments.length > 0 ? '자료에 대해 질문하기' : '추가 질문 입력...'} aria-label="추가 질문 입력" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aab3c5]" />
          <button type="submit" disabled={(!draft.trim() && selectedAttachments.length === 0) || hasUnreadyAttachment} aria-label="질문 보내기" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(95,134,239,0.25)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-[#b9cef7]">
            <Icon name="arrow-up" className="size-[18px]" />
          </button>
        </div>
      </form>
      {dropzoneOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#edf3ff]/85 p-5 backdrop-blur-[1px] md:p-8">
          <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} multiple className="sr-only" onChange={handleFileSelection} />
          <button type="button" aria-label="첨부 닫기" onClick={() => setDropzoneOpen(false)} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white text-sub shadow-sm hover:text-ink">
            <Icon name="x" className="size-5" />
          </button>
          <div
            onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex h-[min(42vh,320px)] w-full max-w-[664px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-5 text-center transition ${dragActive ? 'border-primary bg-[#edf3ff]' : 'border-[#bfd2ff] bg-white/75'}`}
          >
            <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-[#eaf1ff] text-primary"><Icon name="upload" className="size-7" /></span>
            <h2 className="text-base font-semibold text-ink">여기에 놓으면 첨부돼요</h2>
            <p className="mt-2 text-xs text-sub">이미지(JPG·PNG·HEIC)와 PDF를 첨부할 수 있어요</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-brand hover:bg-[#f7f9fc]">파일 선택</button>
          </div>
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-[#aab3c5]">현재는 화면 확인용 목업 답변입니다.</p>
    </main>
  )
}

function AttachmentItem({ attachment, onRemove, variant = 'composer' }: { attachment: LocalAttachment; onRemove?: () => void; variant?: 'composer' | 'sent' }) {
  const { file, format, status, previewUrl, previewUnsupported, pageCount, error } = attachment
  const isImageFile = format !== 'pdf'

  if (variant === 'sent') {
    return (
      <span className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-[#edf1f8] bg-white px-2.5 py-2 text-xs text-ink">
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#edf3ff] text-primary">
          {previewUrl ? <img src={previewUrl} alt={file.name} className="size-full object-cover" /> : <Icon name={isImageFile ? 'image' : 'file'} className="size-4" />}
        </span>
        <span className="truncate">{file.name}</span>
      </span>
    )
  }

  if (isImageFile) {
    const statusLabel = status === 'processing' ? '확인 중' : status === 'error' ? '오류' : previewUnsupported ? 'HEIC' : undefined
    return (
      <div className="relative size-14" title={error ?? file.name}>
        <span className={`flex size-full items-center justify-center overflow-hidden rounded-xl border bg-[#f7f9fc] text-primary ${status === 'error' ? 'border-error text-error' : 'border-[#edf1f8]'}`}>
          {previewUrl ? <img src={previewUrl} alt={file.name} className={`size-full object-cover ${status === 'processing' ? 'opacity-50' : ''}`} /> : <Icon name={status === 'error' ? 'alert' : 'image'} className="size-5" />}
        </span>
        {statusLabel && <span className={`absolute inset-x-1 bottom-1 rounded bg-white/90 text-center text-[9px] font-medium ${status === 'error' ? 'text-error' : 'text-sub'} ${status === 'processing' ? 'animate-pulse' : ''}`}>{statusLabel}</span>}
        {onRemove && (
          <button type="button" aria-label={`${file.name} 첨부 취소`} title="첨부 취소" onClick={onRemove} className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[#202432] text-white shadow-sm">
            <Icon name="x" className="size-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex h-12 w-[220px] min-w-[180px] max-w-full items-center gap-2 rounded-xl border px-2.5 ${error ? 'border-[#f2c9cc] bg-[#fff8f8]' : 'border-[#edf1f8] bg-white'}`}>
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${error ? 'bg-[#fbeaec] text-error' : 'bg-[#edf3ff] text-primary'}`}><Icon name="file" className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-ink">{file.name}</span>
        {error ? (
          <span className="mt-0.5 block truncate text-[11px] text-error">{error}</span>
        ) : status === 'processing' ? (
          <span className="mt-0.5 block animate-pulse text-[11px] text-sub">파일 확인 중…</span>
        ) : (
          <span className="mt-0.5 block truncate text-[11px] text-sub">PDF{pageCount ? ` · ${pageCount}쪽` : ''} · 첨부 준비됨</span>
        )}
      </span>
      {onRemove && (
        <button type="button" aria-label={`${file.name} 첨부 취소`} title="첨부 취소" onClick={onRemove} className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#aab3c5] transition hover:bg-[#f2f5fb] hover:text-sub">
          <Icon name="x" className="size-4" />
        </button>
      )}
    </div>
  )
}

function ConversationNotFound({ onNewChat, onShowHistory }: { onNewChat: () => void; onShowHistory: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#edf3ff] text-brand"><Icon name="chat" className="size-6" /></span>
      <h1 className="mt-3 text-base font-semibold">대화를 찾을 수 없어요</h1>
      <p className="mt-1 text-xs text-sub">삭제되었거나, 새로고침으로 사라진 임시 대화예요.</p>
      <div className="mt-4 flex gap-2">
        <button onClick={onShowHistory} className="h-9 rounded-lg border border-line bg-white px-3 text-xs font-medium text-brand">대화 기록</button>
        <button onClick={onNewChat} className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover">새 대화</button>
      </div>
    </main>
  )
}

export default HomePage
