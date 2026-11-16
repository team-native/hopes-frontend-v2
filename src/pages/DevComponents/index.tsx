import { Bell, ChevronLeft, Flag, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ImageThumb, PdfCard, PdfChip } from '../../components/attach/Attachments'
import QuestionCard from '../../components/chat/QuestionCard'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import CommentList from '../../components/community/CommentList'
import PostCard from '../../components/community/PostCard'
import PostDetail from '../../components/community/PostDetail'
import type { Comment, Post } from '../../components/community/types'
import WriteFab from '../../components/community/WriteFab'
import WritePostModal from '../../components/community/WritePostModal'
import { EmptyState, InlineError, NoticeRow } from '../../components/feedback/Feedback'
import { HeroCard, HomePanel, HomePanelRow, PopularPostRow, TipCard } from '../../components/home/HomeCards'
import SectionHeader from '../../components/layout/SectionHeader'
import MapCard from '../../components/location/MapCard'
import { ProfileCard, ProfileStats } from '../../components/profile/ProfileCards'
import {
  AccountCard,
  ContactCard,
  PromptCard,
  SettingsNav,
  type SettingsMenu,
} from '../../components/settings/SettingsCards'
import { COHORTS, DEPARTMENTS } from '../../constants/school'
import AnswerBubble from '../../components/chat/AnswerBubble'
import AnswerReactions from '../../components/chat/AnswerReactions'
import ChatInput from '../../components/chat/ChatInput'
import RelatedQuestions from '../../components/chat/RelatedQuestions'
import SuggestionRow from '../../components/chat/SuggestionRow'
import UserBubble from '../../components/chat/UserBubble'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import IconButton from '../../components/common/IconButton'
import IconTile from '../../components/common/IconTile'
import NativeBadge from '../../components/common/NativeBadge'
import SearchField from '../../components/common/SearchField'
import TextArea from '../../components/common/TextArea'
import { CommentChip, LikeChip } from '../../components/community/ReactionChips'
import Sidebar, { type RecentChat, type SidebarMenu } from '../../components/layout/Sidebar'
import AttachDropzone from '../../components/attach/AttachDropzone'
import AttachmentComposer from '../../components/chat/AttachmentComposer'
import ActionMenu from '../../components/common/ActionMenu'
import ActionSheet from '../../components/common/ActionSheet'
import BackButton from '../../components/common/BackButton'
import CardSkeleton from '../../components/common/CardSkeleton'
import ChipGroup from '../../components/common/ChipGroup'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { ListCard, ListRow } from '../../components/common/ListRow'
import Switch from '../../components/common/Switch'
import Toast from '../../components/common/Toast'
import CommentInput from '../../components/community/CommentInput'
import ReportDialog from '../../components/community/ReportDialog'
import MobileNav from '../../components/layout/MobileNav'
import SettingToggleRow from '../../components/settings/SettingToggleRow'
import type { LocalAttachment } from '../../types/conversation'

/**
 * 부품 미리보기 (개발 서버에서만: /dev/components)
 * 새 컴포넌트를 만들면 피그마 이름표와 같은 이름으로 여기에 추가해 주세요.
 */

const RECENT_CHATS: RecentChat[] = [
  { id: '1', title: '기숙사 하루 일과가 어떻게 돼?' },
  { id: '2', title: 'Frontend는 뭐부터 공부하면 좋아?' },
  { id: '3', title: '동아리는 언제 정해?' },
  { id: '4', title: '입학하려면 뭘 준비해야 해?' },
]

const USER = { name: '임서하', department: '인공지능과', cohort: '10기' }

const SIDEBAR_STATES: { menu: SidebarMenu | null; chatId?: string }[] = [
  { menu: 'home' },
  { menu: 'chat', chatId: '1' },
  { menu: 'community' },
  { menu: 'history' },
  { menu: null },
]

const SAMPLE_ANSWER = `### Frontend 시작 순서

처음에는 화면을 직접 만들어 보는 것부터 시작하는 걸 추천해요.

1. HTML·CSS로 간단한 페이지 만들기
2. JavaScript 기초 문법 익히기
3. React로 작은 프로젝트 완성하기

\`\`\`html
<button class="primary">
  질문하기
</button>
\`\`\`

> 막히면 선배에게 바로 물어보는 게 제일 빨라요.

[학교 전공 소개 페이지 보기](https://example.com)`

const SAMPLE_ATTACHMENTS: LocalAttachment[] = [
  { id: 'a1', file: new File([''], '생활수칙.pdf'), format: 'pdf', status: 'ready', pageCount: 12 },
  { id: 'a2', file: new File([''], '시간표.pdf'), format: 'pdf', status: 'processing' },
  { id: 'a3', file: new File([''], 'photo.heic'), format: 'heic', status: 'ready', previewUnsupported: true },
]

const SAMPLE_POST: Post = {
  id: 'p1',
  board: '10기',
  title: '기숙사 와이파이 다들 잘 돼?',
  content:
    '3층 끝방인데 저녁만 되면 와이파이가 너무 느려져서 과제 제출이 힘들어. 다른 층은 어떤지, 해결 방법 아는 사람 있으면 알려줘!',
  authorCohort: '10기',
  timeAgo: '10분 전',
  likeCount: 12,
  commentCount: 3,
  liked: true,
}

const SAMPLE_COMMENTS: Comment[] = [
  { id: 'c1', authorCohort: '10기', timeAgo: '5분 전', content: '2층도 저녁엔 느려. 공유기 위치 문제 같아.' },
  { id: 'c2', authorCohort: '9기', timeAgo: '3분 전', content: '사감 선생님께 말씀드리면 점검해 주신대!' },
  { id: 'c3', authorCohort: '10기', timeAgo: '방금', content: '오 고마워, 내일 말씀드려 볼게.', isMine: true },
]

/** 피그마처럼 위에 작은 이름표를 붙여 보여 주는 칸 */
function Specimen({ name, children, className = '' }: { name: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] text-text-tertiary">{name}</p>
      {children}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5xl">
      <h2 className="text-heading">{title}</h2>
      <div className="mt-xl flex flex-wrap items-start gap-x-10 gap-y-8">{children}</div>
    </section>
  )
}

function DevComponentsPage() {
  const [search, setSearch] = useState('기숙사')
  const [liked, setLiked] = useState(true)
  const [board, setBoard] = useState('10기')
  const [department, setDepartment] = useState('인공지능과')
  const [prompt, setPrompt] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenu>('profile')
  // 주소에 ?modal=1 을 붙이면 글쓰기 팝업이 열린 채로 시작
  const [modalOpen, setModalOpen] = useState(() => new URLSearchParams(window.location.search).has('modal'))
  const [chip, setChip] = useState('전체')
  const [switchOn, setSwitchOn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('도배·광고')
  const [dropzoneOpen, setDropzoneOpen] = useState(false)
  const [composerValue, setComposerValue] = useState('')

  return (
    <main className="min-h-screen bg-bg-canvas px-[111px] pt-12 pb-5xl">
      <h1 className="text-display">Web 부품 미리보기</h1>

      <Group title="사이드바 · 입력창">
        <div className="flex gap-6">
          {SIDEBAR_STATES.map((state) => (
            <div key={state.menu ?? 'none'} className="h-[858px]">
              <Sidebar
                className="border-r-0"
                activeMenu={state.menu}
                activeChatId={state.chatId}
                recentChats={RECENT_CHATS}
                user={USER}
              />
            </div>
          ))}
        </div>
        <Specimen name="Chat/Input" className="w-[720px]">
          <ChatInput onSend={(message) => console.log('send:', message)} />
        </Specimen>
        <Specimen name="Native Badge">
          <div className="flex items-center gap-3">
            <NativeBadge />
            <NativeBadge size="sm" />
          </div>
        </Specimen>
      </Group>

      <Group title="1. 작은 부품">
        <Specimen name="Nav/Icon Button">
          <IconButton icon={ChevronLeft} label="뒤로 가기" />
        </Specimen>
        <Specimen name="Nav/Icon Button Boxed">
          <IconButton icon={Bell} label="알림" variant="boxed" dot />
        </Specimen>
        <Specimen name="Icon/Tile">
          <IconTile icon={Pencil} />
        </Specimen>
        <Specimen name="Community/Board Badge">
          <div className="flex gap-1.5">
            <Badge>전체</Badge>
            <Badge>10기</Badge>
          </div>
        </Specimen>
        <Specimen name="Community/Like Chip">
          <div className="flex gap-1.5">
            <LikeChip count={liked ? 12 : 11} liked={liked} onClick={() => setLiked((v) => !v)} />
            <LikeChip count={4} />
          </div>
        </Specimen>
        <Specimen name="Community/Comment Chip">
          <CommentChip count={3} />
        </Specimen>
        <Specimen name="Profile/Avatar">
          <div className="flex items-center gap-2">
            <Avatar name="임서하" />
            <Avatar name="임서하" size="md" />
          </div>
        </Specimen>
        <Specimen name="Form/Search Field" className="w-[300px]">
          <SearchField value={search} onChange={setSearch} placeholder="검색" />
        </Specimen>
        <Specimen name="Form/Text Area" className="w-[300px]">
          <TextArea rows={2} defaultValue="3층 끝방인데 저녁만 되면 너무 느려져서" autoFocus />
        </Specimen>
      </Group>

      <Group title="2. 채팅">
        <Specimen name="Chat/Bubble User" className="w-[360px]">
          <UserBubble>프론트엔드는 뭐부터 공부하면 좋아?</UserBubble>
        </Specimen>
        <Specimen name="Chat/Bubble Answer + Answer Reactions" className="w-[420px]">
          <AnswerBubble
            content={SAMPLE_ANSWER}
            footer={<AnswerReactions onSelect={(key) => console.log('reaction:', key)} />}
          />
        </Specimen>
        <Specimen name="Chat/Related Questions" className="w-[360px]">
          <RelatedQuestions
            questions={['포트폴리오는 언제부터 만들었어?', '전공 동아리 들어가려면 뭐 준비해?']}
            onSelect={(q) => console.log('related:', q)}
          />
        </Specimen>
        <Specimen name="Chat/Suggestion Row" className="w-[360px]">
          <SuggestionRow text="기숙사 하루 일과가 어떻게 돼?" onClick={() => console.log('suggestion')} />
        </Specimen>
        <Specimen name="Web/Question Card" className="w-[362px]">
          <QuestionCard
            question="기숙사 하루 일과가 어떻게 돼?"
            category="학교생활"
            onClick={() => console.log('question')}
          />
        </Specimen>
      </Group>

      <Group title="3. 첨부">
        <Specimen name="Attach/Image Thumb">
          <ImageThumb onRemove={() => console.log('remove image')} />
        </Specimen>
        <Specimen name="Attach/PDF Card" className="w-[220px]">
          <PdfCard name="생활수칙.pdf" pages={12} onRemove={() => console.log('remove pdf')} />
        </Specimen>
        <Specimen name="Attach/PDF Chip">
          <PdfChip name="생활수칙.pdf" />
        </Specimen>
      </Group>

      <Group title="4. 커뮤니티">
        <Specimen name="Community/Post Card" className="w-[362px]">
          <PostCard post={{ ...SAMPLE_POST, commentCount: 5 }} />
        </Specimen>
        <Specimen name="Community/Post Detail" className="w-[362px]">
          <PostDetail post={SAMPLE_POST} />
        </Specimen>
        <Specimen name="Community/Comment List" className="w-[362px]">
          <CommentList comments={SAMPLE_COMMENTS} />
        </Specimen>
        <Specimen name="Community/Board Select" className="w-[362px]">
          <Select
            variant="inline"
            label="게시판"
            placeholder="선택"
            options={COHORTS}
            value={board}
            onChange={setBoard}
          />
        </Specimen>
        <Specimen name="Community/FAB Write">
          <WriteFab onClick={() => setModalOpen(true)} />
        </Specimen>
        <Specimen name="Web/Modal (글쓰기)">
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
            글쓰기 팝업 열기
          </Button>
          <WritePostModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            boards={COHORTS}
            defaultBoard="10기"
            onSubmit={(values) => console.log('post:', values)}
          />
        </Specimen>
        <Specimen name="Web/Dropdown (회원가입 과 선택과 같은 부품)" className="w-[194px]">
          <Select label="과" placeholder="과 선택" options={DEPARTMENTS} value={department} onChange={setDepartment} />
        </Specimen>
      </Group>

      <Group title="5. 홈 · 프로필">
        <Specimen name="Web/Hero Card" className="w-[946px]">
          <HeroCard
            title={'선배에게 묻는\n가장 솔직한 학교 이야기'}
            description="기숙사, 전공, 취업 질문에 선배 경험으로 답해요."
            actionText="채팅 시작하기"
            onAction={() => console.log('hero')}
          />
        </Specimen>
        <Specimen name="Home/Panel + Panel Row" className="w-[302px]">
          <HomePanel title="이어서 하기" actionText="더보기" onAction={() => console.log('more')}>
            <HomePanelRow title="기숙사 하루 일과가 어떻게 돼?" meta="어제" />
            <HomePanelRow title="Frontend는 뭐부터 공부하면 좋아?" meta="2일 전" />
          </HomePanel>
        </Specimen>
        <Specimen name="Home/Popular Post Row" className="w-[302px]">
          <HomePanel title="커뮤니티 인기글" actionText="더보기" onAction={() => console.log('more')}>
            <PopularPostRow board="전체" title="전공 동아리 면접 후기 공유" likeCount={34} />
            <PopularPostRow board="9기" title="취업 준비 언제부터 시작했어?" likeCount={21} />
          </HomePanel>
        </Specimen>
        <Specimen name="Home/Tip Card" className="w-[302px]">
          <HomePanel title="질문 잘하는 방법" divided={false}>
            <TipCard step={1} caption="질문 전에," text="학과·전공을 먼저 골라요" />
            <TipCard step={2} caption="“기숙사 어때” 보단," text="“1학년 기숙사 평일 루틴 알려줘”" />
          </HomePanel>
        </Specimen>
        <Specimen name="Layout/Section Header" className="w-[362px]">
          <SectionHeader title="질문 잘하는 방법" />
        </Specimen>
        <Specimen name="Profile/Profile Card" className="w-[362px]">
          <ProfileCard
            name="임서하"
            department="인공지능과"
            cohort="10기"
            email="s26055@gsm.hs.kr"
            onEdit={() => console.log('edit')}
          />
        </Specimen>
        <Specimen name="Profile/Stats" className="w-[280px]">
          <ProfileStats
            stats={[
              { label: '작성글', value: 2 },
              { label: '댓글', value: 5 },
              { label: '대화', value: 12 },
            ]}
          />
        </Specimen>
      </Group>

      <Group title="6. 설정 · 알림">
        <Specimen name="Notify/Notice Row" className="w-[362px]">
          <NoticeRow
            message={'맞춤 추천을 불러오지 못했어요.\n기본 질문을 보여드려요.'}
            actionText="다시 시도"
            onAction={() => {}}
          />
        </Specimen>
        <Specimen name="Feedback/Inline Error" className="w-[362px]">
          <InlineError
            title="자료를 분석하지 못했어요"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요. 첨부한 자료는 그대로 남아 있어요."
            onRetry={() => {}}
          />
        </Specimen>
        <Specimen name="Feedback/Empty State" className="w-[362px]">
          <EmptyState
            title="아직 게시글이 없어요"
            description="이 게시판의 첫 글을 남겨보세요."
            actionText="글쓰기"
            onAction={() => {}}
          />
        </Specimen>
        <Specimen name="Settings/Prompt Card" className="w-[362px]">
          <PromptCard value={prompt} onChange={setPrompt} />
        </Specimen>
        <Specimen name="Settings/Contact Card" className="w-[362px]">
          <ContactCard
            email={contactEmail}
            message={contactMessage}
            onEmailChange={setContactEmail}
            onMessageChange={setContactMessage}
          />
        </Specimen>
        <Specimen name="Settings/Account Card" className="w-[362px]">
          <AccountCard
            rows={[
              { label: '이메일', value: 's26055@gsm.hs.kr' },
              { label: '전공', value: '인공지능소프트웨어과' },
            ]}
          />
        </Specimen>
        <Specimen name="Web/Settings Nav" className="w-[220px]">
          <SettingsNav active={settingsMenu} onSelect={setSettingsMenu} onLogout={() => console.log('logout')} />
        </Specimen>
      </Group>

      <Group title="7. 위치">
        <Specimen name="Location/Map Card" className="w-[328px]">
          <MapCard label="광주소프트웨어마이스터고 위치" />
        </Specimen>
      </Group>

      {/* 피그마 컴포넌트에 없어서 화면 작업 중 공통으로 만든 부품 */}
      <Group title="8. 추가 공통 부품">
        <Specimen name="ChipGroup">
          <ChipGroup
            label="게시판"
            options={['전체', ...COHORTS].map((value) => ({ value, label: value }))}
            value={chip}
            onChange={setChip}
          />
        </Specimen>
        <Specimen name="ChipGroup (개수)">
          <ChipGroup
            label="활동"
            options={[
              { value: '작성글', label: '작성글', count: 2 },
              { value: '댓글', label: '댓글', count: 5 },
            ]}
            value="작성글"
            onChange={() => {}}
          />
        </Specimen>
        <Specimen name="Switch">
          <div className="flex gap-3">
            <Switch checked={switchOn} onChange={setSwitchOn} label="스위치" />
            <Switch checked={false} onChange={() => {}} label="꺼짐" />
            <Switch checked={false} onChange={() => {}} label="비활성" disabled />
          </div>
        </Specimen>
        <Specimen name="SettingToggleRow" className="w-[420px]">
          <ListCard className="px-md">
            <li>
              <SettingToggleRow
                title="새 답변 알림"
                description="선배 답변이 도착하면 알려드려요."
                checked={switchOn}
                onChange={setSwitchOn}
              />
            </li>
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
        </Specimen>
        <Specimen name="ListCard · ListRow" className="w-[420px]">
          <ListCard>
            <ListRow
              icon={MessageCircle}
              title="기숙사 하루 일과가 어떻게 돼?"
              description="평일은 저녁 식사 후 자습, 점호 순서로..."
              meta="어제"
              onClick={() => {}}
            />
            <ListRow
              icon={MessageCircle}
              title="기숙사 와이파이 다들 잘 돼?"
              meta="10분 전"
              trailing={
                <ActionMenu
                  label="더보기"
                  items={[
                    { label: '수정', icon: Pencil },
                    { label: '삭제', icon: Trash2, danger: true, onSelect: () => {} },
                  ]}
                />
              }
            />
            <ListRow title="이용약관" onClick={() => {}} trailing={<Badge>준비 중</Badge>} />
          </ListCard>
        </Specimen>
        <Specimen name="CardSkeleton" className="w-[420px]">
          <CardSkeleton count={2} />
        </Specimen>
        <Specimen name="BackButton">
          <BackButton onClick={() => {}}>10기 게시판</BackButton>
        </Specimen>
        <Specimen name="CommentInput" className="w-[420px]">
          <CommentInput onSubmit={(content) => console.log(content)} />
        </Specimen>
        <Specimen name="팝업: ConfirmDialog · ActionSheet · ReportDialog">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirmOpen(true)}>
              ConfirmDialog
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSheetOpen(true)}>
              ActionSheet
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setReportOpen(true)}>
              ReportDialog
            </Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            title="이 대화를 삭제할까요?"
            description="삭제한 대화는 되돌릴 수 없어요."
            confirmText="삭제"
            tone="danger"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
          />
          <ActionSheet
            open={sheetOpen}
            title="게시글 메뉴"
            items={[
              { label: '게시글 수정', icon: Pencil, onSelect: () => setSheetOpen(false) },
              { label: '게시글 삭제', icon: Trash2, danger: true, onSelect: () => setSheetOpen(false) },
              { label: '신고하기', icon: Flag },
            ]}
            onClose={() => setSheetOpen(false)}
          />
          <ReportDialog
            open={reportOpen}
            target="게시글"
            reason={reportReason}
            onReasonChange={setReportReason}
            onClose={() => setReportOpen(false)}
            onSubmit={() => setReportOpen(false)}
          />
        </Specimen>
        <Specimen name="AttachmentComposer" className="w-[720px]">
          <AttachmentComposer
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={() => setComposerValue('')}
            onAttach={() => setDropzoneOpen(true)}
            attachments={SAMPLE_ATTACHMENTS}
            onRemoveAttachment={() => {}}
            canSend={composerValue.trim() !== ''}
          />
        </Specimen>
        <Specimen name="AttachDropzone" className="w-[720px]">
          <div className="relative h-[360px] rounded-lg border border-border-subtle bg-bg-surface">
            <Button size="sm" variant="secondary" className="m-md" onClick={() => setDropzoneOpen(true)}>
              열기
            </Button>
            <AttachDropzone
              open={dropzoneOpen}
              onClose={() => setDropzoneOpen(false)}
              onFiles={(files) => console.log(files)}
            />
          </div>
        </Specimen>
        <Specimen name="MobileNav (모바일 너비에서만 보여요)" className="w-[375px]">
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <MobileNav activeMenu="community" onNewChat={() => {}} />
          </div>
        </Specimen>
        <Specimen name="Toast (화면 아래 고정)">
          <p className="text-caption text-text-secondary">useToast의 showToast로 띄워요.</p>
          <Toast message="" />
        </Specimen>
      </Group>
    </main>
  )
}

export default DevComponentsPage
