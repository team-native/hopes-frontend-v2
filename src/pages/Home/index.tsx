import { BedDouble, Bell, Code, FileText, Heart, MapPin, RefreshCw, Trash2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AttachDropzone from '../../components/attach/AttachDropzone'
import AnswerBubble from '../../components/chat/AnswerBubble'
import AnswerReactions from '../../components/chat/AnswerReactions'
import AttachmentComposer from '../../components/chat/AttachmentComposer'
import QuestionCard from '../../components/chat/QuestionCard'
import RelatedQuestions from '../../components/chat/RelatedQuestions'
import UserBubble from '../../components/chat/UserBubble'
import ActionMenu from '../../components/common/ActionMenu'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import IconButton from '../../components/common/IconButton'
import LogoMark from '../../components/common/LogoMark'
import Select from '../../components/common/Select'
import Toast from '../../components/common/Toast'
import { EmptyState } from '../../components/feedback/Feedback'
import { HeroCard, HomePanel, HomePanelRow, PopularPostRow, TipCard } from '../../components/home/HomeCards'
import AppLayout from '../../components/layout/AppLayout'
import { getBoards, getPosts } from '../../api/community'
import {
  getChatPreferences,
  getDepartments,
  getSpecialties,
  updateChatPreferences,
  type CategoryDto,
} from '../../api/catalog'
import { getRecommendations, getRecommendationConsent, type RecommendationDto } from '../../api/recommendations'
import useAppNavigation from '../../hooks/useAppNavigation'
import useLikeToggle from '../../hooks/useLikeToggle'
import useAttachmentDraft from '../../hooks/useAttachmentDraft'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import {
  getAttachment,
  getAttachmentContent,
  sendLocationCheck,
  type AttachmentDto,
  type ChatMessage,
  type ChatNavigationRequest,
  type LocationRequest,
} from '../../api/chats'
import ChatLocationCard from '../../components/location/ChatLocationCard'
import type { Conversation, LocalAttachment } from '../../types/conversation'
import type { Profile } from '../../types/profile'
import { ATTACHMENT_ACCEPT } from '../../utils/attachments'
import { getApiErrorMessage } from '../../utils/error'
import { createId } from '../../utils/id'
import { stagger } from '../../utils/motion'

const QUESTION_ICONS = [BedDouble, FileText, Code, Heart]

const RECENT_CONVERSATION_COUNT = 3

type HomeScreen = 'home' | 'chat' | 'conversation'
type QuestionSuggestion = { title: string; category: string; icon: LucideIcon; id?: number }

function HomePage() {
  // 화면 상태는 URL에서 매 렌더마다 계산한다. (/ → 홈, /chat → 새 대화, /chat/:conversationId → 대화)
  const { conversationId } = useParams()
  const { pathname } = useLocation()
  const screen: HomeScreen = conversationId ? 'conversation' : pathname.startsWith('/chat') ? 'chat' : 'home'

  const { goToSection, startNewChat, openConversation, openCommunityPost } = useAppNavigation()
  const {
    conversations,
    getConversation,
    createConversation,
    sendMessage,
    loadConversation,
    loadOlderMessages,
    deleteConversation,
  } = useConversations()
  // 재시도 키: 같은 질문(내용 + 첨부)을 다시 보내면 같은 키를 써서 서버가 한 번만 저장해요.
  // (답변이 늦게 와서 다시 눌러도 질문이 두 번 생기지 않아요. 성공하면 비워요)
  const retryKeyRef = useRef<{ signature: string; key: string } | null>(null)
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
  // 학과 · 전공(내 설정)을 다 받은 뒤에 추천 질문을 한 번만 불러와요. (먼저 부르면 일반 추천 → 학과 추천으로 두 번 바뀌어요)
  const [catalogReady, setCatalogReady] = useState(false)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  // 늦게 온 이전 응답이 최신 추천을 덮어쓰지 않게 요청 순서를 세요
  const recommendationRequestRef = useRef(0)
  const [isSending, setIsSending] = useState(false)
  const loadedConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!conversationId || loadedConversationIdRef.current === conversationId) return
    loadedConversationIdRef.current = conversationId
    const current = getConversation(conversationId)
    if (current?.messages?.some(({ id }) => id < 0)) return
    void loadConversation(conversationId).catch((error) =>
      showToast(getApiErrorMessage(error, '대화를 불러오지 못했어요.')),
    )
  }, [conversationId, getConversation, loadConversation, showToast])

  useEffect(() => {
    let active = true
    Promise.all([getDepartments(), getSpecialties(), getChatPreferences(), getRecommendationConsent()])
      .then(([departmentGroups, specialtyGroupsData, preferences, consent]) => {
        if (!active) return
        const departments = Object.values(departmentGroups)
          .flat()
          .filter(({ isActive }) => isActive)
        const specialties = Object.values(specialtyGroupsData)
          .flat()
          .filter(({ isActive }) => isActive)
        setDepartmentCatalog(departments)
        setDepartmentOptions(departments.map(({ name }) => name))
        setSpecialtyGroups(specialtyGroupsData)
        const activeDepartment = departments.find(({ id }) => id === preferences.departmentId) ?? departments[0]
        const activeSpecialty = specialties.find(({ id }) => id === preferences.specialtyId)
        const relatedSpecialties = activeDepartment
          ? (specialtyGroupsData[activeDepartment.name] ?? specialties)
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
      // 설정을 못 받아도 기본 추천은 보여 줘요
      .finally(() => {
        if (active) setCatalogReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const loadRecommendations = useCallback(
    async (refresh = false) => {
      const request = ++recommendationRequestRef.current
      try {
        const result = await getRecommendations({
          departmentId,
          specialtyId,
          personalized: recommendationConsent,
          limit: 4,
          refreshToken: refresh ? recommendationRefreshTokenRef.current : undefined,
          excludeIds: refresh ? recommendationItemsRef.current.map(({ id }) => id) : undefined,
        })
        if (request !== recommendationRequestRef.current) return
        recommendationItemsRef.current = result.items
        setRecommendationItems(result.items)
        recommendationRefreshTokenRef.current = result.nextRefreshToken
      } catch {
        if (request !== recommendationRequestRef.current) return
        setRecommendationItems([])
      } finally {
        if (request === recommendationRequestRef.current) setRecommendationsLoading(false)
      }
    },
    [departmentId, specialtyId, recommendationConsent],
  )

  useEffect(() => {
    if (catalogReady) void loadRecommendations()
  }, [catalogReady, loadRecommendations])

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
    void updateChatPreferences({ departmentId: nextDepartmentId ?? null, specialtyId: null }).catch(() =>
      showToast('학과 설정을 저장하지 못했어요.'),
    )
  }

  function changeMajor(value: string) {
    const specialties = Object.values(specialtyGroups).flat()
    const nextSpecialtyId = specialties.find(({ name }) => name === value)?.id
    setMajor(value)
    setSpecialtyId(nextSpecialtyId)
    void updateChatPreferences({ departmentId: departmentId ?? null, specialtyId: nextSpecialtyId ?? null }).catch(() =>
      showToast('전공 설정을 저장하지 못했어요.'),
    )
  }

  function requestKeyFor(text: string, attachments: LocalAttachment[], navigation?: ChatNavigationRequest) {
    // 길찾기 정보(목적지 · 출발 · 엘리베이터)가 다르면 다른 요청이에요. 같은 키를 쓰면 서버가 409로 거절해요.
    const signature = [text, ...attachments.map(({ serverId }) => serverId), JSON.stringify(navigation ?? {})].join(
      '\u0000',
    )
    if (retryKeyRef.current?.signature !== signature) {
      const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : createId('message')
      retryKeyRef.current = { signature, key }
    }
    return retryKeyRef.current.key
  }

  async function startConversation(
    question: string,
    attachments: LocalAttachment[] = [],
    onConversationCreated?: (id: string) => void,
  ) {
    if (isSending) return false
    setIsSending(true)
    try {
      await createConversation(
        question,
        attachments,
        { departmentId, specialtyId },
        (id) => {
          onConversationCreated?.(id)
          openConversation(id)
        },
        requestKeyFor(question, attachments),
      )
      retryKeyRef.current = null
      setDraft('')
      return true
    } catch (error) {
      showToast(getApiErrorMessage(error, '메시지를 보내지 못했어요.'))
      return false
    } finally {
      setIsSending(false)
    }
  }

  async function submitQuestion(
    attachments: LocalAttachment[],
    question: string,
    onConversationCreated?: (id: string) => void,
    navigation?: ChatNavigationRequest,
  ) {
    const text = question.trim() || (attachments.length > 0 ? '첨부 자료 요약해줘' : '')
    if (!text || isSending) return false
    if (!conversationId || screen !== 'conversation') return startConversation(text, attachments, onConversationCreated)
    setIsSending(true)
    // 보내는 순간 입력창을 비워요(입력창에 쓴 질문을 보낼 때만. 추가 질문을 눌렀을 때 쓰던 글은 그대로 둬요).
    // 실패하면 사용자가 다시 쓰지 않았을 때만 원래 질문을 되돌려 놔요.
    setDraft((current) => (current === question ? '' : current))
    try {
      await sendMessage(
        conversationId,
        text,
        attachments,
        { departmentId, specialtyId },
        requestKeyFor(text, attachments, navigation),
        navigation,
      )
      retryKeyRef.current = null
      return true
    } catch (error) {
      setDraft((current) => current || question)
      showToast(getApiErrorMessage(error, '메시지를 보내지 못했어요.'))
      return false
    } finally {
      setIsSending(false)
    }
  }

  async function removeConversation(id: string) {
    try {
      await deleteConversation(id)
      showToast('대화를 삭제했어요.')
      startNewChat()
    } catch (error) {
      showToast(getApiErrorMessage(error, '대화를 삭제하지 못했어요.'))
    }
  }

  async function showOlderMessages(id: string) {
    try {
      await loadOlderMessages(id)
    } catch (error) {
      showToast(getApiErrorMessage(error, '이전 메시지를 불러오지 못했어요.'))
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
          const { locationResult } = await sendLocationCheck(id, request)
          showToast(locationResult.message)
        } catch (error) {
          showToast(getApiErrorMessage(error, '위치를 확인하지 못했어요.'))
        }
      },
      () => showToast('브라우저에서 위치 권한을 허용해 주세요.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  return (
    <AppLayout
      activeMenu={screen === 'home' ? 'home' : 'chat'}
      activeConversationId={conversation?.id}
      fitScreen={screen === 'conversation' && Boolean(conversation)}
    >
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
          onToast={showToast}
        />
      ) : screen === 'chat' ? (
        <NewChatView
          department={department}
          major={major}
          departmentOptions={departmentOptions}
          majorOptions={specialtyOptions}
          suggestions={suggestions}
          suggestionsLoading={recommendationsLoading}
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
          category={[department, major].filter(Boolean).join(' · ') || '추천 질문'}
          suggestions={suggestions}
          onCheckLocation={() => void checkChatLocation(conversation.id)}
          onAsk={(question) => void submitQuestion([], question)}
          onNavigate={(question, navigation) => void submitQuestion([], question, undefined, navigation)}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuestion}
          onToast={showToast}
          messages={conversation.messages ?? []}
          hasMoreMessages={Boolean(conversation.hasMoreMessages)}
          onLoadOlder={() => showOlderMessages(conversation.id)}
          onDelete={() => removeConversation(conversation.id)}
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
  onToast: (message: string) => void
}

type PopularPost = { id: string; board: string; title: string; likes: number; liked: boolean }

function HomeView({
  profile,
  recentConversations,
  onStartChat,
  onOpenConversation,
  onOpenPost,
  onShowHistory,
  onShowCommunity,
  onNotify,
  onToast,
}: HomeViewProps) {
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([])
  /** 좋아요 — 커뮤니티 목록과 같은 방식 (useLikeToggle 참고) */
  const toggleLikeRequest = useLikeToggle({
    onChange: (postId, { liked, likeCount }) =>
      setPopularPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, liked, likes: likeCount } : post)),
      ),
    onError: () => onToast('좋아요를 반영하지 못했어요. 잠시 후 다시 시도해 주세요.'),
  })
  const toggleLike = (post: PopularPost) => toggleLikeRequest(post.id, { liked: post.liked, likeCount: post.likes })

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
              liked: post.likedByMe,
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
        <div className="animate-fade-up">
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
        </div>

        <div className="grid grid-cols-1 items-start gap-lg md:grid-cols-2 xl:grid-cols-3">
          <HomePanel
            title="이어서 하기"
            actionText="더보기"
            onAction={onShowHistory}
            className="animate-fade-up"
            style={stagger(1, 60)}
          >
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

          <HomePanel
            title="커뮤니티 인기글"
            actionText="더보기"
            onAction={onShowCommunity}
            className="animate-fade-up"
            style={stagger(2, 60)}
          >
            {popularPosts.map((post) => (
              <PopularPostRow
                key={post.id}
                board={post.board}
                title={post.title}
                likeCount={post.likes}
                liked={post.liked}
                onClick={() => onOpenPost(post.id)}
                onToggleLike={() => toggleLike(post)}
              />
            ))}
          </HomePanel>

          <HomePanel
            title="질문 잘하는 방법"
            divided={false}
            className="animate-fade-up md:col-span-2 xl:col-span-1"
            style={stagger(3, 60)}
          >
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
  /** 추천 질문을 처음 불러오는 중 (카드 자리에 회색 자리표시) */
  suggestionsLoading: boolean
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
  suggestionsLoading,
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
            size="sm"
            label="학과"
            placeholder="선택"
            options={departmentOptions}
            value={department}
            onChange={onDepartmentChange}
            className="w-[230px]"
          />
          <Select
            variant="inline"
            size="sm"
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
          {suggestionsLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                role={index === 0 ? 'status' : undefined}
                aria-label={index === 0 ? '추천 질문 불러오는 중' : undefined}
                className="h-[132px] animate-pulse rounded-lg border border-border-subtle bg-bg-surface p-md"
              >
                <div className="size-8 rounded-sm bg-bg-canvas" />
                <div className="mt-sm h-3.5 w-3/4 rounded-full bg-bg-canvas" />
                <div className="mt-2 h-3 w-1/4 rounded-full bg-bg-canvas" />
              </div>
            ))
          ) : rotatedSuggestions.length ? (
            rotatedSuggestions.map((question, index) => (
              <div key={question.id ?? question.title} className="animate-fade-up" style={stagger(index, 50)}>
                <QuestionCard
                  question={question.title}
                  category={question.category}
                  icon={question.icon}
                  onClick={() => onAsk(question.title)}
                />
              </div>
            ))
          ) : (
            <p className="py-md text-caption text-text-secondary">추천 질문을 불러오지 못했어요.</p>
          )}
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
  /** 서버에 더 오래된 메시지가 있으면 맨 위에 "이전 메시지 보기" */
  hasMoreMessages: boolean
  onLoadOlder: () => Promise<void>
  /** 대화 옵션 → 대화 삭제 (확인 팝업 뒤) */
  onDelete: () => Promise<void>
  suggestions: QuestionSuggestion[]
  isSending: boolean
  /** 추천 질문을 눌렀을 때 새 대화로 묻기 */
  onAsk: (question: string) => void
  /** 도면 카드에서 목적지 선택 · 길찾기 요청 (같은 대화에 새 메시지로 보내요) */
  onNavigate: (question: string, navigation: ChatNavigationRequest) => void
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
  hasMoreMessages,
  onLoadOlder,
  onDelete,
  suggestions,
  isSending,
  draft,
  onAsk,
  onNavigate,
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
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const scrollRef = useRef<HTMLElement>(null)
  const scrollMarkRef = useRef<{ firstId?: number; lastId?: number; height: number }>({ height: 0 })

  // 2) 추가로 많이 묻는 질문: 첫 질문의 답변이 나왔을 때만 보여 줘요. 다음 질문부터는 숨겨요.
  const userMessageCount = messages.filter(({ role }) => role === 'USER').length
  const showRelatedQuestions =
    !isSending && userMessageCount === 1 && messages.at(-1)?.role === 'ASSISTANT' && relatedQuestions.length > 0

  // 새 메시지 · 답변 대기 표시가 생기면 맨 아래로, 이전 메시지를 위에 붙였을 때는 보던 위치를 그대로 유지해요
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const mark = scrollMarkRef.current
    const firstId = messages[0]?.id
    const lastId = messages.at(-1)?.id
    const prepended = mark.lastId !== undefined && lastId === mark.lastId && firstId !== mark.firstId
    if (prepended) element.scrollTop += element.scrollHeight - mark.height
    else element.scrollTo({ top: element.scrollHeight, behavior: mark.height ? 'smooth' : 'auto' })
    scrollMarkRef.current = { firstId, lastId, height: element.scrollHeight }
  }, [messages, isSending])

  async function loadOlder() {
    setLoadingOlder(true)
    await onLoadOlder()
    setLoadingOlder(false)
  }

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
    // AppLayout(fitScreen)이 화면 높이에 맞춰 주고, 여기서는 남은 높이를 채운 뒤 메시지 영역만 스크롤해요
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-5 pb-4 md:px-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-title">{title}</h1>
          <p className="mt-1 text-caption text-text-secondary">{category}</p>
        </div>
        <div className="flex gap-2">
          <IconButton icon={MapPin} label="현재 위치 확인" onClick={onCheckLocation} />
          <ActionMenu
            label="대화 옵션"
            items={[{ label: '대화 삭제', icon: Trash2, danger: true, onSelect: () => setDeleteOpen(true) }]}
          />
        </div>
      </header>

      <section
        ref={scrollRef}
        aria-label="대화 내용"
        className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5 md:-mx-8 md:px-8"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col justify-end gap-md py-xl">
          {hasMoreMessages && (
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={loadingOlder}
              className="mx-auto rounded-full border border-border-subtle bg-bg-surface px-4 py-1.5 text-caption text-text-secondary transition hover:text-text-primary disabled:cursor-wait disabled:opacity-60"
            >
              {loadingOlder ? '불러오는 중…' : '이전 메시지 보기'}
            </button>
          )}
          {messages.map((message) =>
            message.role === 'USER' ? (
              <div key={message.id} className="animate-fade-up space-y-2">
                <UserBubble>{message.content}</UserBubble>
                <MessageAttachments attachments={message.attachments} />
              </div>
            ) : (
              <div key={message.id} className="flex animate-fade-up items-start gap-3">
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
                  {message.location && (
                    <ChatLocationCard location={message.location} onNavigate={onNavigate} disabled={isSending} />
                  )}
                </div>
              </div>
            ),
          )}
          {isSending && <WaitingAnswer />}
          {showRelatedQuestions && <RelatedQuestions questions={relatedQuestions} onSelect={onAsk} />}
        </div>
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

      <ConfirmDialog
        open={deleteOpen}
        title="대화를 삭제할까요?"
        description="이 대화와 모든 메시지가 영구 삭제돼요."
        confirmText="삭제"
        tone="danger"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          void onDelete()
        }}
      />
    </main>
  )
}

/** 기다린 시간에 따라 바뀌는 문구 (AI 답변은 길면 1분 가까이 걸려요) */
const WAITING_STEPS = [
  { after: 0, text: '답변을 준비하고 있어요' },
  { after: 5, text: '선배들의 경험을 찾아보고 있어요' },
  { after: 15, text: '답변을 정리하고 있어요' },
  { after: 30, text: '조금 오래 걸리고 있어요. 잠시만 기다려 주세요' },
]

/** 답변 기다리는 중 — 로고 옆 말풍선에서 점 세 개가 차례로 튀어요 */
function WaitingAnswer() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const text = [...WAITING_STEPS].reverse().find(({ after }) => seconds >= after)?.text ?? WAITING_STEPS[0].text

  return (
    <div role="status" aria-live="polite" className="flex animate-fade-up items-start gap-3">
      <span className="animate-soft-pulse rounded-full">
        <LogoMark size={40} />
      </span>
      <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-5 py-3.5 shadow-cloud-sm">
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="size-1.5 animate-typing-dot rounded-full bg-icon-brand"
              style={{ animationDelay: `${index * 160}ms` }}
            />
          ))}
        </span>
        {/* 문구가 바뀔 때마다 살짝 나타나요 */}
        <span key={text} className="animate-fade-in text-label text-text-secondary">
          {text}
        </span>
      </div>
    </div>
  )
}

function MessageAttachments({ attachments }: { attachments: AttachmentDto[] }) {
  const [metadata, setMetadata] = useState<AttachmentDto[]>(attachments)
  const [downloadUrls, setDownloadUrls] = useState<Record<number, string>>({})
  const downloadUrlsRef = useRef<Record<number, string>>({})
  const [error, setError] = useState('')

  const attachmentIdsKey = attachments.map(({ id }) => id).join(',')

  useEffect(() => {
    if (!attachmentIdsKey) return
    let active = true
    Promise.all(attachmentIdsKey.split(',').map((id) => getAttachment(Number(id))))
      .then((items) => {
        if (active) setMetadata(items)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [attachmentIdsKey])

  useEffect(() => () => Object.values(downloadUrlsRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  const visibleMetadata = metadata.map(({ id }) => id).join(',') === attachmentIdsKey ? metadata : attachments

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

  if (!attachments.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {visibleMetadata.map((attachment) => (
        <div
          key={attachment.id}
          className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-caption"
        >
          <span>{attachment.fileName}</span>
          {downloadUrls[attachment.id] ? (
            <a
              className="ml-2 text-text-brand underline"
              href={downloadUrls[attachment.id]}
              download={attachment.fileName}
            >
              다운로드
            </a>
          ) : (
            <button
              className="ml-2 text-text-brand underline"
              type="button"
              onClick={() => void downloadAttachment(attachment)}
            >
              다운로드
            </button>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="w-full text-caption text-text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export default HomePage
