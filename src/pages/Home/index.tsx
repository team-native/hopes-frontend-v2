import {
  ArrowUp,
  BedDouble,
  Bell,
  Code,
  Ellipsis,
  FileText,
  Heart,
  Info,
  Plus,
  RefreshCw,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { PDFDocumentLoadingTask } from 'pdfjs-dist'
import { ImageThumb, PdfCard, PdfChip } from '../../components/attach/Attachments'
import AnswerBubble from '../../components/chat/AnswerBubble'
import AnswerReactions from '../../components/chat/AnswerReactions'
import ChatInput from '../../components/chat/ChatInput'
import QuestionCard from '../../components/chat/QuestionCard'
import UserBubble from '../../components/chat/UserBubble'
import Button from '../../components/common/Button'
import FieldError from '../../components/common/FieldError'
import IconButton from '../../components/common/IconButton'
import LogoMark from '../../components/common/LogoMark'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import { EmptyState } from '../../components/feedback/Feedback'
import { HeroCard, PopularPostRow, TipCard } from '../../components/home/HomeCards'
import AppLayout from '../../components/layout/AppLayout'
import SectionHeader from '../../components/layout/SectionHeader'
import { DEPARTMENTS } from '../../constants/school'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import type { Conversation, LocalAttachment } from '../../types/conversation'
import type { Profile } from '../../types/profile'
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_COUNT,
  canDisplayImage,
  checkAttachmentFile,
  matchesFileSignature,
} from '../../utils/attachments'
import { createId } from '../../utils/id'

const MAJORS = ['Frontend', 'Backend', 'AI'] as const

const popularPosts = [
  { board: '전체', title: '전공 동아리 면접 후기 공유', likeCount: 34 },
  { board: '9기', title: '취업 준비 언제부터 시작했어?', likeCount: 21 },
  { board: '10기', title: '기숙사 와이파이 다들 잘 돼?', likeCount: 12 },
]

const suggestedQuestions: { title: string; category: string; icon: LucideIcon }[] = [
  { title: '기숙사 하루 일과가 어떻게 돼?', category: '학교생활', icon: BedDouble },
  { title: '입학하려면 뭘 준비해야 해?', category: '입학', icon: FileText },
  { title: 'Frontend는 뭐부터 공부하면 좋아?', category: '전공 · Frontend', icon: Code },
  { title: '후배한테 해주고 싶은 조언 있어?', category: '학교생활', icon: Heart },
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
    reference: '학교 전공 소개 페이지',
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
    bullets: [
      '평일 외출은 사감 선생님 승인 후 가능해요.',
      '주말 외출은 금요일까지 신청해야 해요.',
      '복귀 시간은 일요일 저녁 9시예요.',
    ],
  },
  location: {
    category: '학교 생활',
    heading: '현재 위치 확인은 hopes 앱에서만 할 수 있어요',
    body: '웹에서는 학교 지도와 건물 정보를 안내해 드려요.',
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

/** 목업 답변을 AnswerBubble이 그리는 마크다운으로 바꿔요 (서버 연동 후에는 응답 마크다운을 그대로 사용) */
function toMarkdown(answer: MockAnswer) {
  const parts = [`## ${answer.heading}`, answer.body]
  if (answer.steps) parts.push(answer.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'))
  if (answer.bullets) parts.push(answer.bullets.map((bullet) => `- ${bullet}`).join('\n'))
  if (answer.code) parts.push(`\`\`\`html\n${answer.code}\n\`\`\``)
  if (answer.reference) parts.push(`> 참고: ${answer.reference}`)
  if (answer.citation) parts.push(`> 출처: ${answer.citation}`)
  return parts.join('\n\n')
}

const RECENT_CONVERSATION_COUNT = 3

type HomeScreen = 'home' | 'chat' | 'conversation'

function HomePage() {
  // 화면 상태는 URL에서 매 렌더마다 계산한다. (/ → 홈, /chat → 새 대화, /chat/:conversationId → 대화)
  const { conversationId } = useParams()
  const { pathname } = useLocation()
  const screen: HomeScreen = conversationId ? 'conversation' : pathname.startsWith('/chat') ? 'chat' : 'home'

  const { startNewChat, openConversation } = useAppNavigation()
  const { conversations, getConversation, createConversation } = useConversations()
  const { profile } = useProfile()
  const conversation = conversationId ? getConversation(conversationId) : undefined
  const { toast, showToast } = useToast()

  const [draft, setDraft] = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [major, setMajor] = useState<string>(MAJORS[0])

  function startConversation(question: string, attachments: LocalAttachment[] = []) {
    const id = createConversation(question, attachments)
    setDraft('')
    openConversation(id)
  }

  /** 질문을 받아 새 대화를 만들었으면 true. 첨부는 이때 대화로 소유권이 넘어간다. */
  function submitQuestion(attachments: LocalAttachment[], question: string) {
    const text = question.trim() || (attachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!text) return false
    startConversation(text, attachments)
    return true
  }

  return (
    <AppLayout activeMenu={screen === 'home' ? 'home' : 'chat'} activeConversationId={conversation?.id}>
      {screen === 'home' ? (
        <HomeView
          profile={profile}
          recentConversations={conversations.slice(0, RECENT_CONVERSATION_COUNT)}
          onStartChat={startNewChat}
          onOpenConversation={openConversation}
          onOpenQuestion={startConversation}
          onNotify={() => showToast('새로운 알림이 없어요.')}
        />
      ) : screen === 'chat' ? (
        <NewChatView
          department={department}
          major={major}
          onDepartmentChange={setDepartment}
          onMajorChange={setMajor}
          onAsk={startConversation}
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
        <main className="flex flex-1 items-center justify-center px-5 py-16">
          <EmptyState
            title="대화를 찾을 수 없어요"
            description="삭제되었거나, 새로고침으로 사라진 임시 대화예요."
            actionText="새 대화"
            onAction={startNewChat}
          />
        </main>
      )}
      <Toast message={toast} />
    </AppLayout>
  )
}

type HomeViewProps = {
  profile: Profile
  recentConversations: Conversation[]
  onStartChat: () => void
  onOpenConversation: (conversationId: string) => void
  onOpenQuestion: (question: string) => void
  onNotify: () => void
}

function HomeView({
  profile,
  recentConversations,
  onStartChat,
  onOpenConversation,
  onOpenQuestion,
  onNotify,
}: HomeViewProps) {
  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 pt-5 pb-10 md:px-8 md:pt-6">
      <header className="mb-xl flex items-start justify-between">
        <div>
          <h1 className="text-title">
            <span className="text-text-brand">안녕하세요,</span> {profile.name}님
          </h1>
          <p className="mt-1 text-label text-text-secondary">
            {profile.department} · {profile.generation}
          </p>
        </div>
        <IconButton icon={Bell} label="알림" variant="boxed" onClick={onNotify} />
      </header>

      <div className="mx-auto max-w-[854px] space-y-xl">
        <HeroCard
          title={
            <>
              <span className="text-text-brand">선배</span>에게 묻는{'\n'}
              <span className="text-text-brand">가장 솔직한</span> 학교 이야기
            </>
          }
          description="기숙사, 전공, 취업 질문에 선배 경험으로 답해요."
          actionText="채팅 시작하기"
          onAction={onStartChat}
        />

        <div className="grid grid-cols-1 items-start gap-xl md:grid-cols-2 xl:grid-cols-3">
          <section className="space-y-sm">
            <SectionHeader title="이어서 하기" />
            {recentConversations.length === 0 ? (
              <p className="py-md text-caption text-text-secondary">아직 대화가 없어요.</p>
            ) : (
              recentConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenConversation(item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-surface px-md py-3 text-left shadow-cloud-sm transition hover:border-border-brand"
                >
                  <span className="truncate text-caption font-medium">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-text-tertiary">{item.age}</span>
                </button>
              ))
            )}
          </section>

          <section className="space-y-sm">
            <SectionHeader title="커뮤니티 인기글" />
            {popularPosts.map((post) => (
              <PopularPostRow
                key={post.title}
                board={post.board}
                title={post.title}
                likeCount={post.likeCount}
                onClick={() => onOpenQuestion(post.title)}
              />
            ))}
          </section>

          <section className="space-y-sm md:col-span-2 xl:col-span-1">
            <SectionHeader title="질문 잘하는 방법" />
            <TipCard step={1} caption="질문 전에," text="학과·전공을 먼저 골라요" />
            <TipCard step={2} caption="‘기숙사 하루’ 보다," text="‘1학년 기숙사 평일 루틴 알려줘’" />
          </section>
        </div>
      </div>
    </main>
  )
}

type NewChatViewProps = {
  department: string
  major: string
  onDepartmentChange: (value: string) => void
  onMajorChange: (value: string) => void
  onAsk: (question: string) => void
}

function NewChatView({ department, major, onDepartmentChange, onMajorChange, onAsk }: NewChatViewProps) {
  const [suggestionOffset, setSuggestionOffset] = useState(0)
  const rotatedSuggestions = suggestedQuestions.map(
    (_, index) => suggestedQuestions[(index + suggestionOffset) % suggestedQuestions.length],
  )

  return (
    <main className="flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pt-5 pb-4 md:min-h-screen md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-sm">
        <h1 className="text-title">새 대화</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            variant="inline"
            label="학과"
            placeholder="선택"
            options={DEPARTMENTS}
            value={department}
            onChange={onDepartmentChange}
            className="w-[230px]"
          />
          <Select
            variant="inline"
            label="전공"
            placeholder="선택"
            options={MAJORS}
            value={major}
            onChange={onMajorChange}
            className="w-[160px]"
          />
        </div>
      </header>

      <section className="mx-auto mt-3xl w-full max-w-[720px] text-center">
        <h2 className="text-title md:text-display">
          무엇이 <span className="text-text-brand">궁금한</span>가요?
        </h2>
        <p className="mt-xs text-label text-text-secondary">광주소프트웨어마이스터고 선배에게 편하게 물어보세요.</p>
        <div className="mt-xl flex items-center justify-between text-left text-caption text-text-secondary">
          <span>
            {department} · {major} 추천 질문
          </span>
          <IconButton
            icon={RefreshCw}
            label="추천 질문 순서 바꾸기"
            onClick={() => setSuggestionOffset((offset) => offset + 1)}
          />
        </div>
        <div className="mt-xs grid grid-cols-1 gap-sm text-left sm:grid-cols-2">
          {rotatedSuggestions.map((question) => (
            <QuestionCard
              key={question.title}
              question={question.title}
              category={question.category}
              icon={question.icon}
              onClick={() => onAsk(question.title)}
            />
          ))}
        </div>
      </section>

      <ChatInput className="mx-auto mt-auto pt-xl" onSend={onAsk} />
    </main>
  )
}

type ConversationViewProps = {
  title: string
  draft: string
  attachments: LocalAttachment[]
  onDraftChange: (value: string) => void
  onSubmit: (attachments: LocalAttachment[], question: string) => boolean
  onToast: (message: string) => void
}

function ConversationView({ title, draft, attachments, onDraftChange, onSubmit, onToast }: ConversationViewProps) {
  const answer: MockAnswer = attachments.length > 0 ? getAttachmentAnswer(attachments) : getMockAnswer(title)
  const answerMarkdown = toMarkdown(answer)
  const [selectedAttachments, setSelectedAttachments] = useState<LocalAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [dropzoneOpen, setDropzoneOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 첨부 리소스 소유권: 전송 전까지는 이 입력창이 소유하고, 제거·화면 종료 시 해제한다.
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
      const id = createId('attachment')
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
    const destroyPdfTask = () => {
      void pdfTask?.destroy().catch(() => undefined)
    }

    try {
      const signatureMatches = await matchesFileSignature(file, format)
      if (signal.aborted) return
      if (!signatureMatches) {
        updateAttachment(id, { status: 'error', error: '파일 내용이 형식과 맞지 않아요.' })
        return
      }

      if (format === 'pdf') {
        // pdf.js(약 440KB + 워커)는 PDF를 첨부했을 때만 내려받아요.
        const pdfjsLib = await import('pdfjs-dist')
        if (signal.aborted) return
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
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
      updateAttachment(id, {
        status: 'error',
        error: format === 'pdf' ? 'PDF를 읽지 못했어요. 파일을 확인해 주세요.' : '파일을 읽지 못했어요.',
      })
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
  const imageErrors = selectedAttachments.filter(({ format, error }) => format !== 'pdf' && error)
  const hasUnsupportedPreview = selectedAttachments.some(({ previewUnsupported }) => previewUnsupported)
  const canSend = (draft.trim() !== '' || selectedAttachments.length > 0) && !hasUnreadyAttachment

  function handleConversationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return
    const accepted = onSubmit(selectedAttachments, draft)
    if (!accepted) return
    // 전송한 첨부의 미리보기 URL은 대화가 소유하므로 여기서는 해제하지 않고 소유 목록에서만 뺀다.
    processingJobsRef.current.clear()
    ownedPreviewUrlsRef.current.clear()
    setSelectedAttachments([])
    setAttachmentError('')
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answerMarkdown)
      onToast('답변을 복사했어요.')
    } catch {
      onToast('이 브라우저에서는 복사할 수 없어요.')
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pt-5 pb-4 md:min-h-screen md:px-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-title">{answer.category}</h1>
          <p className="mt-1 text-caption text-text-secondary">소프트웨어개발과 · {answer.category}</p>
        </div>
        <IconButton icon={Ellipsis} label="대화 옵션" onClick={() => onToast('대화 옵션은 준비 중이에요.')} />
      </header>

      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-end gap-md py-xl">
        {attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2" aria-label="전송한 첨부 파일">
            {attachments.map((attachment) =>
              attachment.format === 'pdf' ? (
                <PdfChip key={attachment.id} name={attachment.file.name} />
              ) : (
                <ImageThumb key={attachment.id} src={attachment.previewUrl} alt={attachment.file.name} />
              ),
            )}
          </div>
        )}
        <UserBubble>{title}</UserBubble>
        <div className="flex items-start gap-3">
          <LogoMark size={40} />
          <div className="min-w-0 flex-1">
            <AnswerBubble
              content={answerMarkdown}
              footer={
                <AnswerReactions
                  reactions={[
                    { key: 'copy', label: '복사' },
                    { key: 'save', label: '저장' },
                    { key: 'share', label: '공유' },
                  ]}
                  onSelect={(key) => {
                    if (key === 'copy') void copyAnswer()
                    else onToast(key === 'save' ? '답변 저장은 준비 중이에요.' : '공유는 준비 중이에요.')
                  }}
                />
              }
            />
          </div>
        </div>
      </section>

      <form
        onSubmit={handleConversationSubmit}
        className="mx-auto w-full max-w-[720px] rounded-lg border border-border-subtle bg-bg-surface p-3 shadow-cloud-md transition focus-within:border-border-brand"
      >
        {attachmentError && <FieldError className="mb-3">{attachmentError}</FieldError>}
        {selectedAttachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedAttachments.map((attachment) => (
              <ComposerAttachment
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeSelectedFile(attachment.id)}
              />
            ))}
          </div>
        )}
        {selectedAttachments.length > 0 && (
          <div className="mb-3 space-y-1 text-[11px]">
            {imageErrors.map((attachment) => (
              <FieldError key={attachment.id} className="">
                {attachment.file.name} · {attachment.error}
              </FieldError>
            ))}
            {hasUnsupportedPreview && (
              <p className="flex items-center gap-1 text-text-secondary">
                <Info className="size-3.5 shrink-0 text-icon-muted" strokeWidth={1.75} aria-hidden />이 브라우저에서는
                HEIC 미리보기를 지원하지 않아요. 파일은 그대로 첨부돼요.
              </p>
            )}
            <p className="flex items-center gap-1 text-text-tertiary">
              <Info className="size-3.5 shrink-0 text-icon-muted" strokeWidth={1.75} aria-hidden />
              목업 단계라 첨부 파일은 서버로 업로드되지 않아요.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="자료 첨부"
            onClick={() => setDropzoneOpen(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-canvas text-icon-brand transition hover:bg-bg-brand-soft"
          >
            <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              // 한글 조합 중 Enter로는 보내지 않음
              if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
            }}
            placeholder={selectedAttachments.length > 0 ? '자료에 대해 질문하기' : '추가 질문 입력...'}
            aria-label="추가 질문 입력"
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-text-tertiary"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="질문 보내기"
            className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-bg-brand text-icon-on-brand shadow-cloud-brand transition enabled:hover:bg-bg-brand-pressed disabled:cursor-not-allowed disabled:bg-bg-brand-disabled disabled:shadow-none"
          >
            <ArrowUp className="size-[18px]" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </form>
      <p className="mt-2.5 text-center text-caption text-text-tertiary">현재는 화면 확인용 목업 답변입니다.</p>

      {dropzoneOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-brand-soft/85 p-5 backdrop-blur-[1px] md:p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            className="sr-only"
            onChange={handleFileSelection}
          />
          <IconButton
            icon={X}
            label="첨부 닫기"
            variant="boxed"
            onClick={() => setDropzoneOpen(false)}
            className="absolute top-4 right-4"
          />
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex h-[min(42vh,320px)] w-full max-w-[664px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-brand px-5 text-center transition ${
              dragActive ? 'bg-bg-brand-soft' : 'bg-bg-surface/75'
            }`}
          >
            <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-bg-brand-soft text-icon-brand">
              <Upload className="size-7" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="text-body-strong">여기에 놓으면 첨부돼요</h2>
            <p className="mt-2 text-caption text-text-secondary">이미지(JPG·PNG·HEIC)와 PDF를 첨부할 수 있어요</p>
            <Button size="sm" variant="secondary" className="mt-md" onClick={() => fileInputRef.current?.click()}>
              파일 선택
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

/** 입력창 위 첨부 하나 — 이미지는 ImageThumb, PDF는 PdfCard에 로컬 확인 상태를 덧붙여요 */
function ComposerAttachment({ attachment, onRemove }: { attachment: LocalAttachment; onRemove: () => void }) {
  const { file, format, status, previewUrl, previewUnsupported, pageCount, error } = attachment

  if (format === 'pdf') {
    const description =
      error ?? (status === 'processing' ? '파일 확인 중…' : `PDF${pageCount ? ` · ${pageCount}쪽` : ''} · 첨부 준비됨`)
    return (
      <div className="w-[220px] max-w-full">
        <PdfCard name={file.name} description={description} invalid={Boolean(error)} onRemove={onRemove} />
      </div>
    )
  }

  const statusLabel =
    status === 'processing' ? '확인 중' : status === 'error' ? '오류' : previewUnsupported ? 'HEIC' : undefined
  return (
    <div className={`relative ${status === 'processing' ? 'animate-pulse' : ''}`} title={error ?? file.name}>
      <ImageThumb src={previewUrl} alt={file.name} onRemove={onRemove} />
      {statusLabel && (
        <span
          className={`pointer-events-none absolute inset-x-1 bottom-1 rounded-[4px] bg-bg-surface/90 text-center text-[9px] font-medium ${
            status === 'error' ? 'text-text-danger' : 'text-text-secondary'
          }`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  )
}

export default HomePage
