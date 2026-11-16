import { BedDouble, Bell, Code, Ellipsis, FileText, Heart, MapPin, RefreshCw, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AttachDropzone from '../../components/attach/AttachDropzone'
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
import { getBoards, getPosts } from '../../api/community'
import { getChatPreferences, getDepartments, getSpecialties, updateChatPreferences, type CategoryDto } from '../../api/catalog'
import { getRecommendations, getRecommendationConsent, type RecommendationDto } from '../../api/recommendations'
import useAppNavigation from '../../hooks/useAppNavigation'
import useAttachmentDraft from '../../hooks/useAttachmentDraft'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import { getAttachment, getAttachmentContent, sendLocationCheck, type AttachmentDto, type ChatMessage, type LocationRequest } from '../../api/chats'
import type { Conversation, LocalAttachment } from '../../types/conversation'
import type { Profile } from '../../types/profile'
import { ATTACHMENT_ACCEPT } from '../../utils/attachments'

const QUESTION_ICONS = [BedDouble, FileText, Code, Heart]

const RECENT_CONVERSATION_COUNT = 3

type HomeScreen = 'home' | 'chat' | 'conversation'
type QuestionSuggestion = { title: string; category: string; icon: LucideIcon; id?: number }

function HomePage() {
  // 화면 상태는 URL에서 매 렌더마다 계산한다. (/ → 홈, /chat → 새 대화, /chat/:conversationId → 대화)
  const { conversationId } = useParams()
  const { pathname } = useLocation()
  const screen: HomeScreen = conversationId ? 'conversation' : pathname.startsWith('/chat') ? 'chat' : 'home'

  const { goToSection, startNewChat, openConversation, openCommunityPost, openCampus } = useAppNavigation()
  const { conversations, getConversation, createConversation, sendMessage, loadConversation } = useConversations()
  const { profile } = useProfile()
  const conversation = conversationId ? getConversation(conversationId) : undefined
  const { toast, showToast } = useToast()

  const [draft, setDraft] = useState('')
  const [department, setDepartment] = useState('')
  const [major, setMajor] = useState('')
  const [departmentId, setDepartmentId] = useState<number>()
  const [specialtyId, setSpecialtyId] = useState<number>()
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([])
  const [departmentCatalog, setDepartmentCatalog] = useState<CategoryDto[]>([])
  const [specialtyGroups, setSpecialtyGroups] = useState<Record<string, CategoryDto[]>>({})
  const [recommendationConsent, setRecommendationConsent] = useState(false)
  const [recommendationItems, setRecommendationItems] = useState<RecommendationDto[]>([])
  const recommendationRefreshTokenRef = useRef<string | undefined>(undefined)
  const recommendationItemsRef = useRef<RecommendationDto[]>([])
  const [isSending, setIsSending] = useState(false)
  const loadedConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!conversationId || loadedConversationIdRef.current === conversationId) return
    loadedConversationIdRef.current = conversationId
    const current = getConversation(conversationId)
    if (current?.messages?.some(({ id }) => id < 0)) return
    void loadConversation(conversationId).catch(() =>
      showToast('대화를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'),
    )
  }, [conversationId, getConversation, loadConversation, showToast])

  useEffect(() => {
    let active = true
    Promise.all([getDepartments(), getSpecialties(), getChatPreferences(), getRecommendationConsent()])
      .then(([departmentGroups, specialtyGroupsData, preferences, consent]) => {
        if (!active) return
        const departments = Object.values(departmentGroups).flat().filter(({ isActive }) => isActive)
        const specialties = Object.values(specialtyGroupsData).flat().filter(({ isActive }) => isActive)
        setDepartmentCatalog(departments)
        setDepartmentOptions(departments.map(({ name }) => name))
        setSpecialtyGroups(specialtyGroupsData)
        const activeDepartment = departments.find(({ id }) => id === preferences.departmentId) ?? departments[0]
        const activeSpecialty = specialties.find(({ id }) => id === preferences.specialtyId)
        const relatedSpecialties = activeDepartment
          ? specialtyGroupsData[activeDepartment.name] ?? specialties
          : specialties
        const selectedSpecialty = activeSpecialty ?? relatedSpecialties[0]
        setDepartmentId(activeDepartment?.id)
        setSpecialtyId(selectedSpecialty?.id)
        setDepartment(activeDepartment?.name ?? '')
        setSpecialtyOptions(relatedSpecialties.filter(({ isActive }) => isActive).map(({ name }) => name))
        setMajor(selectedSpecialty?.name ?? '')
        setRecommendationConsent(consent.enabled)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const loadRecommendations = useCallback(async (refresh = false) => {
    try {
      const result = await getRecommendations({
        departmentId,
        specialtyId,
        personalized: recommendationConsent,
        limit: 4,
        refreshToken: refresh ? recommendationRefreshTokenRef.current : undefined,
        excludeIds: refresh ? recommendationItemsRef.current.map(({ id }) => id) : undefined,
      })
      recommendationItemsRef.current = result.items
      setRecommendationItems(result.items)
      recommendationRefreshTokenRef.current = result.nextRefreshToken
    } catch {
      setRecommendationItems([])
    }
  }, [departmentId, specialtyId, recommendationConsent])

  useEffect(() => {
    void loadRecommendations()
  }, [loadRecommendations])

  const suggestions = useMemo(() => {
    return recommendationItems.map((item, index) => ({
      title: item.content,
      category: major || '추천 질문',
      icon: QUESTION_ICONS[index % QUESTION_ICONS.length],
      id: item.id,
    }))
  }, [major, recommendationItems])

  function changeDepartment(value: string) {
    const nextDepartmentId = departmentCatalog.find(({ name }) => name === value)?.id
    const specialties = specialtyGroups[value] ?? Object.values(specialtyGroups).flat()
    setDepartment(value)
    setDepartmentId(nextDepartmentId)
    setSpecialtyId(undefined)
    setSpecialtyOptions(specialties.filter(({ isActive }) => isActive).map(({ name }) => name))
    setMajor('')
    void updateChatPreferences({ departmentId: nextDepartmentId ?? null, specialtyId: null }).catch(() => showToast('학과 설정을 저장하지 못했어요.'))
  }

  function changeMajor(value: string) {
    const specialties = Object.values(specialtyGroups).flat()
    const nextSpecialtyId = specialties.find(({ name }) => name === value)?.id
    setMajor(value)
    setSpecialtyId(nextSpecialtyId)
    void updateChatPreferences({ departmentId: departmentId ?? null, specialtyId: nextSpecialtyId ?? null }).catch(() => showToast('전공 설정을 저장하지 못했어요.'))
  }


  async function startConversation(
    question: string,
    attachments: LocalAttachment[] = [],
    onConversationCreated?: (id: string) => void,
  ) {
    if (isSending) return false
    setIsSending(true)
    try {
      await createConversation(question, attachments, { departmentId, specialtyId }, (id) => {
        onConversationCreated?.(id)
        openConversation(id)
      })
      setDraft('')
      return true
    } catch {
      showToast('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  async function submitQuestion(
    attachments: LocalAttachment[],
    question: string,
    onConversationCreated?: (id: string) => void,
  ) {
    const text = question.trim() || (attachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!text || isSending) return false
    if (!conversationId || screen !== 'conversation') return startConversation(text, attachments, onConversationCreated)
    setIsSending(true)
    try {
      await sendMessage(conversationId, text, attachments, { departmentId, specialtyId })
      setDraft('')
      return true
    } catch {
      showToast('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  async function checkChatLocation(id: string) {
    if (!navigator.geolocation) {
      showToast('이 브라우저에서는 현재 위치를 사용할 수 없어요.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords, timestamp }) => {
        const request: LocationRequest = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          horizontalAccuracyMeters: coords.accuracy,
          measuredAt: new Date(timestamp).toISOString(),
        }
        try {
          const result = await sendLocationCheck(id, request)
          showToast(String(result.message ?? '위치를 확인했어요.'))
        } catch {
          showToast('위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
        }
      },
      () => showToast('브라우저에서 위치 권한을 허용해 주세요.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
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
          onShowCampus={openCampus}
          onNotify={() => showToast('새로운 알림이 없어요.')}
        />
      ) : screen === 'chat' ? (
        <NewChatView
          department={department}
          major={major}
          departmentOptions={departmentOptions}
          majorOptions={specialtyOptions}
          suggestions={suggestions}
          onRefreshSuggestions={() => void loadRecommendations(true)}
          onDepartmentChange={changeDepartment}
          onMajorChange={changeMajor}
          onAsk={startConversation}
          onSubmit={submitQuestion}
        />
      ) : conversation ? (
        <ConversationView
          key={conversation.id}
          title={conversation.title}
          category={`${department} · ${major}`}
          suggestions={suggestions}
          onCheckLocation={() => void checkChatLocation(conversation.id)}
          onAsk={startConversation}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuestion}
          onToast={showToast}
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
  onShowCampus: () => void
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
  onShowCampus,
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
        <div className="flex gap-2">
          <IconButton icon={MapPin} label="학교 위치" variant="boxed" onClick={onShowCampus} />
          <IconButton icon={Bell} label="알림" variant="boxed" onClick={onNotify} />
        </div>
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
  departmentOptions: string[]
  majorOptions: string[]
  suggestions: QuestionSuggestion[]
  onRefreshSuggestions: () => void
  onDepartmentChange: (value: string) => void
  onMajorChange: (value: string) => void
  onAsk: (question: string) => void
  /** 입력창으로 보내기 (첨부 포함). 새 대화를 만들었으면 true */
  onSubmit: (attachments: LocalAttachment[], question: string, onCreated?: (id: string) => void) => Promise<boolean>
}

function NewChatView({
  department,
  major,
  departmentOptions,
  majorOptions,
  suggestions,
  onRefreshSuggestions,
  onDepartmentChange,
  onMajorChange,
  onAsk,
  onSubmit,
}: NewChatViewProps) {
  const [suggestionOffset, setSuggestionOffset] = useState(0)
  const [draft, setDraft] = useState('')
  const draftAttachments = useAttachmentDraft()
  const canSend = (draft.trim() !== '' || draftAttachments.attachments.length > 0) && !draftAttachments.hasUnready

  async function handleSubmit() {
    if (!canSend) return
    if (await onSubmit(draftAttachments.attachments, draft, draftAttachments.handOff)) {
      draftAttachments.handOff()
      setDraft('')
    }
  }
  const rotatedSuggestions = suggestions.map((_, index) => suggestions[(index + suggestionOffset) % suggestions.length])

  return (
    <main className="relative flex min-h-[calc(100vh-105px)] flex-1 flex-col px-5 pt-5 pb-4 md:min-h-screen md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-sm">
        <h1 className="text-title">새 대화</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            variant="inline"
            label="학과"
            placeholder="선택"
            options={departmentOptions}
            value={department}
            onChange={onDepartmentChange}
            className="w-[230px]"
          />
          <Select
            variant="inline"
            label="전공"
            placeholder="선택"
            options={majorOptions}
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
            onClick={() => {
              setSuggestionOffset((offset) => offset + 1)
              onRefreshSuggestions()
            }}
          />
        </div>
        <div className="mt-xs grid grid-cols-1 gap-sm text-left sm:grid-cols-2">
          {rotatedSuggestions.length ? rotatedSuggestions.map((question) => (
            <QuestionCard
              key={question.id ?? question.title}
              question={question.title}
              category={question.category}
              icon={question.icon}
              onClick={() => onAsk(question.title)}
            />
          )) : <p className="py-md text-caption text-text-secondary">추천 질문을 불러오지 못했어요.</p>}
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
  onCheckLocation: () => void
  title: string
  category: string
  messages: ChatMessage[]
  suggestions: QuestionSuggestion[]
  isSending: boolean
  /** 추천 질문을 눌렀을 때 새 대화로 묻기 */
  onAsk: (question: string) => void
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (attachments: LocalAttachment[], question: string) => Promise<boolean>
  onToast: (message: string) => void
}

function ConversationView({
  onCheckLocation,
  title,
  category,
  messages,
  suggestions,
  isSending,
  draft,
  onAsk,
  onDraftChange,
  onSubmit,
  onToast,
}: ConversationViewProps) {
  const relatedQuestions = suggestions
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
      await navigator.clipboard.writeText(
        messages.filter((message) => message.role === 'ASSISTANT').at(-1)?.content ?? '',
      )
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
          <p className="mt-1 text-caption text-text-secondary">{category}</p>
        </div>
        <div className="flex gap-2">
          <IconButton icon={MapPin} label="현재 위치 확인" onClick={onCheckLocation} />
          <IconButton icon={Ellipsis} label="대화 옵션" onClick={() => onToast('대화 옵션은 준비 중이에요.')} />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-end gap-md overflow-y-auto py-xl">
        {messages.map((message) =>
          message.role === 'USER' ? (
            <div key={message.id} className="space-y-2">
              <UserBubble>{message.content}</UserBubble>
              <MessageAttachments attachments={message.attachments} />
            </div>
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
                <MessageAttachments attachments={message.attachments} />
              </div>
            </div>
          ),
        )}
        {isSending && (
          <p role="status" className="text-caption text-text-secondary">
            답변을 기다리고 있어요…
          </p>
        )}
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

function MessageAttachments({ attachments }: { attachments: AttachmentDto[] }) {
  const [metadata, setMetadata] = useState<AttachmentDto[]>(attachments)
  const [downloadUrls, setDownloadUrls] = useState<Record<number, string>>({})
  const downloadUrlsRef = useRef<Record<number, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all(attachments.map(({ id }) => getAttachment(id)))
      .then((items) => {
        if (active) setMetadata(items)
      })
      .catch(() => {
        if (active) setMetadata(attachments)
      })
    return () => {
      active = false
    }
  }, [attachments])

  useEffect(() => () => Object.values(downloadUrlsRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  async function downloadAttachment(attachment: AttachmentDto) {
    try {
      const content = await getAttachmentContent(attachment.id)
      const url = URL.createObjectURL(content)
      if (downloadUrlsRef.current[attachment.id]) URL.revokeObjectURL(downloadUrlsRef.current[attachment.id])
      downloadUrlsRef.current = { ...downloadUrlsRef.current, [attachment.id]: url }
      setDownloadUrls((current) => {
        return { ...current, [attachment.id]: url }
      })
      setError('')
    } catch {
      setError('첨부 파일을 불러오지 못했어요.')
    }
  }

  if (!metadata.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {metadata.map((attachment) => (
        <div key={attachment.id} className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-caption">
          <span>{attachment.fileName}</span>
          {downloadUrls[attachment.id] ? (
            <a className="ml-2 text-text-brand underline" href={downloadUrls[attachment.id]} download={attachment.fileName}>
              다운로드
            </a>
          ) : (
            <button className="ml-2 text-text-brand underline" type="button" onClick={() => void downloadAttachment(attachment)}>
              다운로드
            </button>
          )}
        </div>
      ))}
      {error && <p role="alert" className="w-full text-caption text-text-danger">{error}</p>}
    </div>
  )
}

export default HomePage
