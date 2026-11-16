import { BedDouble, Bell, Code, Ellipsis, FileText, Heart, RefreshCw, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AttachDropzone from '../../components/attach/AttachDropzone'
import { ImageThumb, PdfChip } from '../../components/attach/Attachments'
import AnswerBubble from '../../components/chat/AnswerBubble'
import AnswerReactions from '../../components/chat/AnswerReactions'
import AttachmentComposer from '../../components/chat/AttachmentComposer'
import QuestionCard from '../../components/chat/QuestionCard'
import RelatedQuestions from '../../components/chat/RelatedQuestions'
import UserBubble from '../../components/chat/UserBubble'
import IconButton from '../../components/common/IconButton'
import LogoMark from '../../components/common/LogoMark'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import { EmptyState } from '../../components/feedback/Feedback'
import { HeroCard, HomePanel, HomePanelRow, PopularPostRow, TipCard } from '../../components/home/HomeCards'
import AppLayout from '../../components/layout/AppLayout'
import { DEPARTMENTS } from '../../constants/school'
import { getBoards, getPosts } from '../../api/community'
import useAppNavigation from '../../hooks/useAppNavigation'
import useAttachmentDraft from '../../hooks/useAttachmentDraft'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import type { ChatMessage } from '../../api/chats'
import type { Conversation, LocalAttachment } from '../../types/conversation'
import type { Profile } from '../../types/profile'
import { ATTACHMENT_ACCEPT } from '../../utils/attachments'

const MAJORS = ['Frontend', 'Backend', 'AI'] as const

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
  /** 학교 지도 카드를 함께 보여 줄지 (위치 질문) */
  showMap?: boolean
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
    showMap: true,
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

const RECENT_CONVERSATION_COUNT = 3

type HomeScreen = 'home' | 'chat' | 'conversation'

function HomePage() {
  // 화면 상태는 URL에서 매 렌더마다 계산한다. (/ → 홈, /chat → 새 대화, /chat/:conversationId → 대화)
  const { conversationId } = useParams()
  const { pathname } = useLocation()
  const screen: HomeScreen = conversationId ? 'conversation' : pathname.startsWith('/chat') ? 'chat' : 'home'

  const { goToSection, startNewChat, openConversation, openCommunityPost } = useAppNavigation()
  const { conversations, getConversation, createConversation, sendMessage, loadConversation } = useConversations()
  const { profile } = useProfile()
  const conversation = conversationId ? getConversation(conversationId) : undefined
  const { toast, showToast } = useToast()

  const [draft, setDraft] = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [major, setMajor] = useState<string>(MAJORS[0])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (conversationId) void loadConversation(conversationId).catch(() => showToast('대화를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'))
  }, [conversationId, loadConversation, showToast])

  async function startConversation(question: string, attachments: LocalAttachment[] = []) {
    if (isSending) return false
    setIsSending(true)
    try {
      const id = await createConversation(question, attachments)
      setDraft('')
      openConversation(id)
      return true
    } catch {
      showToast('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  async function submitQuestion(attachments: LocalAttachment[], question: string) {
    const text = question.trim() || (attachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!text || isSending) return false
    if (!conversationId || screen !== 'conversation') return startConversation(text, attachments)
    setIsSending(true)
    try {
      await sendMessage(conversationId, text, attachments)
      setDraft('')
      return true
    } catch {
      showToast('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AppLayout activeMenu={screen === 'home' ? 'home' : 'chat'} activeConversationId={conversation?.id}>
      {screen === 'home' ? (
        <HomeView
          profile={profile}
          recentConversations={conversations.slice(0, RECENT_CONVERSATION_COUNT)}
          onStartChat={startNewChat}
          onOpenConversation={openConversation}
          onOpenPost={openCommunityPost}
          onShowHistory={() => goToSection('history')}
          onShowCommunity={() => goToSection('community')}
          onNotify={() => showToast('새로운 알림이 없어요.')}
        />
      ) : screen === 'chat' ? (
        <NewChatView
          department={department}
          major={major}
          onDepartmentChange={setDepartment}
          onMajorChange={setMajor}
          onAsk={startConversation}
          onSubmit={submitQuestion}
        />
      ) : conversation ? (
        <ConversationView
          key={conversation.id}
          title={conversation.title}
          onAsk={startConversation}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuestion}
          onToast={showToast}
          attachments={conversation.attachments ?? []}
          messages={conversation.messages ?? []}
          isSending={isSending}
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
  onOpenPost: (postId: string) => void
  onShowHistory: () => void
  onShowCommunity: () => void
  onNotify: () => void
}

function HomeView({
  profile,
  recentConversations,
  onStartChat,
  onOpenConversation,
  onOpenPost,
  onShowHistory,
  onShowCommunity,
  onNotify,
}: HomeViewProps) {
  const [popularPosts, setPopularPosts] = useState<{ id: string; board: string; title: string; likes: number }[]>([])

  useEffect(() => {
    let active = true
    Promise.all([getBoards(), getPosts({ page: 0, size: 20 })])
      .then(([boards, page]) => {
        if (!active) return
        setPopularPosts(
          [...page.items]
            .sort((a, b) => b.likeCount - a.likeCount)
            .slice(0, 3)
            .map((post) => ({
              id: String(post.id),
              board: boards.find((board) => board.id === post.boardId)?.name ?? '전체',
              title: post.title,
              likes: post.likeCount,
            })),
        )
      })
      .catch(() => setPopularPosts([]))
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto w-full max-w-[1010px] px-5 pt-5 pb-10 md:px-8 md:pt-6">
      {/* 인사말 · 알림 버튼을 아래 카드들과 같은 폭(946)에 맞춰요 */}
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

      <div className="space-y-lg">
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

        <div className="grid grid-cols-1 items-start gap-lg md:grid-cols-2 xl:grid-cols-3">
          <HomePanel title="이어서 하기" actionText="더보기" onAction={onShowHistory}>
            {recentConversations.length === 0 ? (
              <li className="py-md text-caption text-text-secondary">아직 대화가 없어요.</li>
            ) : (
              recentConversations.map((item) => (
                <HomePanelRow
                  key={item.id}
                  title={item.title}
                  meta={item.age}
                  onClick={() => onOpenConversation(item.id)}
                />
              ))
            )}
          </HomePanel>

          <HomePanel title="커뮤니티 인기글" actionText="더보기" onAction={onShowCommunity}>
            {popularPosts.map((post) => (
              <PopularPostRow
                key={post.id}
                board={post.board}
                title={post.title}
                likeCount={post.likes}
                onClick={() => onOpenPost(post.id)}
              />
            ))}
          </HomePanel>

          <HomePanel title="질문 잘하는 방법" divided={false} className="md:col-span-2 xl:col-span-1">
            <TipCard step={1} caption="질문 전에," text="학과·전공을 먼저 골라요" />
            <TipCard step={2} caption="“기숙사 어때” 보단," text="“1학년 기숙사 평일 루틴 알려줘”" />
          </HomePanel>
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
  /** 입력창으로 보내기 (첨부 포함). 새 대화를 만들었으면 true */
  onSubmit: (attachments: LocalAttachment[], question: string) => Promise<boolean>
}

function NewChatView({ department, major, onDepartmentChange, onMajorChange, onAsk, onSubmit }: NewChatViewProps) {
  const [suggestionOffset, setSuggestionOffset] = useState(0)
  const [draft, setDraft] = useState('')
  const draftAttachments = useAttachmentDraft()
  const canSend = (draft.trim() !== '' || draftAttachments.attachments.length > 0) && !draftAttachments.hasUnready

  async function handleSubmit() {
    if (!canSend) return
    if (await onSubmit(draftAttachments.attachments, draft)) {
      draftAttachments.handOff()
      setDraft('')
    }
  }
  const rotatedSuggestions = suggestedQuestions.map(
    (_, index) => suggestedQuestions[(index + suggestionOffset) % suggestedQuestions.length],
  )

  return (
    <main className="relative flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pt-5 pb-4 md:min-h-screen md:px-8">
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

      <div className="mt-auto pt-xl">
        <AttachmentComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onAttach={draftAttachments.openDropzone}
          attachments={draftAttachments.attachments}
          onRemoveAttachment={draftAttachments.removeAttachment}
          error={draftAttachments.error}
          canSend={canSend}
          placeholder="선배에게 메시지 보내기"
        />
        <p className="mt-2.5 text-center text-caption text-text-tertiary">
          선배 답변은 실제 응답 데이터를 바탕으로 한 참고용이에요.
        </p>
      </div>

      <AttachDropzone
        open={draftAttachments.dropzoneOpen}
        onClose={draftAttachments.closeDropzone}
        onFiles={draftAttachments.addFiles}
        accept={ATTACHMENT_ACCEPT}
      />
    </main>
  )
}

type ConversationViewProps = {
  title: string
  messages: ChatMessage[]
  isSending: boolean
  /** 추천 질문을 눌렀을 때 새 대화로 묻기 */
  onAsk: (question: string) => void
  draft: string
  attachments: LocalAttachment[]
  onDraftChange: (value: string) => void
  onSubmit: (attachments: LocalAttachment[], question: string) => Promise<boolean>
  onToast: (message: string) => void
}

function ConversationView({
  title,
  messages,
  isSending,
  draft,
  attachments,
  onAsk,
  onDraftChange,
  onSubmit,
  onToast,
}: ConversationViewProps) {
  const answer = getMockAnswer(title)
  const relatedQuestions = suggestedQuestions
    .map(({ title: question }) => question)
    .filter((question) => question !== title)
    .slice(0, 3)
  const draftAttachments = useAttachmentDraft()
  const canSend = (draft.trim() !== '' || draftAttachments.attachments.length > 0) && !draftAttachments.hasUnready

  async function handleConversationSubmit() {
    if (!canSend) return
    const accepted = await onSubmit(draftAttachments.attachments, draft)
    if (accepted) draftAttachments.handOff()
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(messages.filter((message) => message.role === 'ASSISTANT').at(-1)?.content ?? '')
      onToast('답변을 복사했어요.')
    } catch {
      onToast('이 브라우저에서는 복사할 수 없어요.')
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pt-5 pb-4 md:min-h-screen md:px-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-title">{title}</h1>
          <p className="mt-1 text-caption text-text-secondary">{answer.category}</p>
        </div>
        <IconButton icon={Ellipsis} label="대화 옵션" onClick={() => onToast('대화 옵션은 준비 중이에요.')} />
      </header>

      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-end gap-md overflow-y-auto py-xl">
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
        {messages.map((message) =>
          message.role === 'USER' ? (
            <UserBubble key={message.id}>{message.content}</UserBubble>
          ) : (
            <div key={message.id} className="flex items-start gap-3">
              <LogoMark size={40} />
              <div className="min-w-0 flex-1">
                <AnswerBubble
                  content={message.content}
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
          ),
        )}
        {isSending && <p role="status" className="text-caption text-text-secondary">답변을 기다리고 있어요…</p>}
        <RelatedQuestions questions={relatedQuestions} onSelect={onAsk} />
      </section>

      <AttachmentComposer
        value={draft}
        onChange={onDraftChange}
        onSubmit={handleConversationSubmit}
        onAttach={draftAttachments.openDropzone}
        attachments={draftAttachments.attachments}
        onRemoveAttachment={draftAttachments.removeAttachment}
        error={draftAttachments.error}
        canSend={canSend && !isSending}
      />
      <p className="mt-2.5 text-center text-caption text-text-tertiary">선배 답변은 참고용으로 확인해 주세요.</p>

      <AttachDropzone
        open={draftAttachments.dropzoneOpen}
        onClose={draftAttachments.closeDropzone}
        onFiles={draftAttachments.addFiles}
        accept={ATTACHMENT_ACCEPT}
      />
    </main>
  )
}

export default HomePage
