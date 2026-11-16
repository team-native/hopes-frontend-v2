import { Bookmark, MessageCircle, Pencil, Trash2, Users, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import ActionMenu, { type ActionMenuItem } from '../../components/common/ActionMenu'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import ChipGroup from '../../components/common/ChipGroup'
import { ListCard, ListRow } from '../../components/common/ListRow'
import TextArea from '../../components/common/TextArea'
import TextField from '../../components/common/TextField'
import Toast from '../../components/common/Toast'
import { EmptyState, NoticeRow } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import { ProfileCard, ProfileStats } from '../../components/profile/ProfileCards'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'
import { mockMyComments, mockMyPosts, mockSavedConversations } from '../../mocks/activity'

type ActivityTab = 'posts' | 'comments' | 'saved'

type ActivityRow = {
  id: string
  title: string
  detail?: string
  meta: string
  actions: ActionMenuItem[]
}

const TAB_ICONS: Record<ActivityTab, LucideIcon> = { posts: Users, comments: MessageCircle, saved: Bookmark }

function MyPage() {
  const { openConversation } = useAppNavigation()
  const { conversations } = useConversations()
  const { profile, updateProfile } = useProfile()
  const { toast, showToast } = useToast()
  const [draftProfile, setDraftProfile] = useState({ name: profile.name, bio: profile.bio })
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts')
  const [posts, setPosts] = useState(mockMyPosts)
  const [comments, setComments] = useState(mockMyComments)
  const [saved, setSaved] = useState(mockSavedConversations)

  function startEditing() {
    setDraftProfile({ name: profile.name, bio: profile.bio })
    setIsEditing(true)
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draftProfile.name.trim()
    if (!name) return
    updateProfile({ name, bio: draftProfile.bio })
    setIsEditing(false)
    showToast('프로필을 저장했어요')
  }

  // TODO: 삭제 · 저장 취소는 API 연동 전까지 화면 목록에서만 제거된다(새로고침 시 복구).
  const rowsByTab: Record<ActivityTab, ActivityRow[]> = {
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      detail: post.excerpt,
      meta: `${post.age} · ♡ ${post.likes} · 댓글 ${post.commentCount}`,
      actions: [
        { label: '수정', icon: Pencil },
        {
          label: '삭제',
          icon: Trash2,
          danger: true,
          onSelect: () => {
            setPosts((current) => current.filter(({ id }) => id !== post.id))
            showToast('작성글을 삭제했어요')
          },
        },
      ],
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      title: comment.content,
      meta: `${comment.postTitle} · ${comment.age}`,
      actions: [
        {
          label: '댓글 삭제',
          icon: Trash2,
          danger: true,
          onSelect: () => {
            setComments((current) => current.filter(({ id }) => id !== comment.id))
            showToast('댓글을 삭제했어요')
          },
        },
      ],
    })),
    saved: saved.map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.savedAge,
      actions: [
        { label: '대화 열기', icon: MessageCircle, onSelect: () => openConversation(item.conversationId) },
        {
          label: '저장 취소',
          icon: Bookmark,
          onSelect: () => {
            setSaved((current) => current.filter(({ id }) => id !== item.id))
            showToast('저장을 취소했어요')
          },
        },
      ],
    })),
  }

  // 개수는 하드코딩하지 않고 목록 길이로 계산해요.
  const tabs: { id: ActivityTab; label: string }[] = [
    { id: 'posts', label: '작성글' },
    { id: 'comments', label: '댓글' },
    { id: 'saved', label: '저장한 대화' },
  ]
  const activeRows = rowsByTab[activeTab]
  const TabIcon = TAB_ICONS[activeTab]

  return (
    <AppLayout activeMenu={null}>
      <main className="mx-auto w-full max-w-[980px] px-5 pt-5 pb-10 md:px-8 md:pt-6">
        <header className="mb-xl">
          <h1 className="text-title">마이페이지</h1>
          <p className="mt-1 text-label text-text-secondary">내 정보와 활동</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-md lg:grid-cols-[minmax(0,1fr)_240px]">
          {isEditing ? (
            <form
              onSubmit={saveProfile}
              className="rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm"
            >
              <div className="mb-md flex items-center gap-3">
                <Avatar name={draftProfile.name.trim() || profile.name} size="md" />
                <div className="min-w-0">
                  <p className="text-body-strong">{draftProfile.name || '이름'}</p>
                  <p className="truncate text-caption text-text-secondary">
                    {profile.department} · {profile.generation} · {profile.email}
                  </p>
                </div>
              </div>
              <TextField
                label="이름"
                value={draftProfile.name}
                onChange={(event) => setDraftProfile((current) => ({ ...current, name: event.target.value }))}
                errorMessage={draftProfile.name.trim() ? undefined : '이름을 입력해 주세요.'}
              />
              <TextArea
                className="mt-md"
                label="자기소개 (AI 응답 개인화에 활용돼요)"
                rows={2}
                value={draftProfile.bio}
                onChange={(event) => setDraftProfile((current) => ({ ...current, bio: event.target.value }))}
              />
              <div className="mt-md flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button size="sm" type="submit" disabled={!draftProfile.name.trim()}>
                  저장
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-sm">
              <ProfileCard
                name={profile.name}
                department={profile.department}
                cohort={profile.generation}
                email={profile.email}
                onEdit={startEditing}
              />
              {profile.bio && <p className="px-1 text-label text-text-secondary">{profile.bio}</p>}
            </div>
          )}

          <ProfileStats
            stats={[
              { label: '작성글', value: posts.length },
              { label: '댓글', value: comments.length },
              { label: '대화', value: conversations.length },
            ]}
          />
        </div>

        <ChipGroup
          className="mt-xl"
          label="마이페이지 활동"
          options={tabs.map((tab) => ({ value: tab.id, label: tab.label, count: rowsByTab[tab.id].length }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-sm">
          <NoticeRow message="목업 단계라 삭제 · 저장 취소는 이 화면에서만 반영되고, 새로고침하면 되돌아가요." />
        </div>

        <section className="mt-sm" aria-live="polite">
          {activeRows.length === 0 ? (
            <div className="py-3xl">
              <EmptyState icon={TabIcon} title="아직 표시할 활동이 없어요" />
            </div>
          ) : (
            <ListCard className="px-md">
              {activeRows.map((row) => (
                <ListRow
                  key={row.id}
                  icon={TabIcon}
                  title={row.title}
                  description={row.detail}
                  meta={row.meta}
                  trailing={<ActionMenu label={`${row.title} 더보기`} items={row.actions} />}
                />
              ))}
            </ListCard>
          )}
        </section>
      </main>
      <Toast message={toast} />
    </AppLayout>
  )
}

export default MyPage
