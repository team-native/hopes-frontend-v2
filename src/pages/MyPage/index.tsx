import { MessageCircle, Pencil, Trash2, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { deleteComment, deletePost, getMyComments, getMyPosts } from '../../api/community'
import ActionMenu, { type ActionMenuItem } from '../../components/common/ActionMenu'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import ChipGroup from '../../components/common/ChipGroup'
import { ListCard, ListRow } from '../../components/common/ListRow'
import TextArea from '../../components/common/TextArea'
import TextField from '../../components/common/TextField'
import Toast from '../../components/common/Toast'
import { EmptyState } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import { ProfileCard, ProfileStats } from '../../components/profile/ProfileCards'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import useProfile from '../../hooks/useProfile'
import useToast from '../../hooks/useToast'

type ActivityTab = 'posts' | 'comments'

type ActivityRow = {
  id: string
  title: string
  detail?: string
  meta: string
  onClick?: () => void
  actions: ActionMenuItem[]
}

type MyPost = { id: string; title: string; excerpt: string; age: string; likes: number; commentCount: number }
type MyComment = { id: string; postId: string; content: string; postTitle: string; age: string }

function formatAge(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return days === 1 ? '어제' : `${days}일 전`
}

const TAB_ICONS: Record<ActivityTab, LucideIcon> = { posts: Users, comments: MessageCircle }

function MyPage() {
  const { openCommunityPost } = useAppNavigation()
  const { conversations } = useConversations()
  const { profile, updateProfile } = useProfile()
  const { toast, showToast } = useToast()
  const [draftProfile, setDraftProfile] = useState({ name: profile.name, bio: profile.bio })
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts')
  const [posts, setPosts] = useState<MyPost[]>([])
  const [comments, setComments] = useState<MyComment[]>([])

  useEffect(() => {
    let active = true
    Promise.all([getMyPosts({ page: 0, size: 50 }), getMyComments({ page: 0, size: 50 })])
      .then(([postPage, commentPage]) => {
        if (!active) return
        setPosts(
          postPage.items.map((post) => ({
            id: String(post.id),
            title: post.title,
            excerpt: post.preview,
            age: formatAge(post.createdAt),
            likes: post.likeCount,
            commentCount: post.commentCount,
          })),
        )
        setComments(
          commentPage.items.map((comment) => ({
            id: String(comment.id),
            postId: String(comment.postId),
            content: comment.content,
            postTitle: comment.postTitle ?? '게시글',
            age: formatAge(comment.createdAt),
          })),
        )
      })
      .catch(() => {
        if (active) showToast('내 활동을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      })
    return () => {
      active = false
    }
  }, [showToast])

  function startEditing() {
    setDraftProfile({ name: profile.name, bio: profile.bio })
    setIsEditing(true)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draftProfile.name.trim()
    if (!name) return
    try {
      await updateProfile({ name, bio: draftProfile.bio })
      setIsEditing(false)
      showToast('프로필을 저장했어요')
    } catch {
      showToast('프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  const rowsByTab: Record<ActivityTab, ActivityRow[]> = {
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      detail: post.excerpt,
      meta: `${post.age} · ♡ ${post.likes} · 댓글 ${post.commentCount}`,
      onClick: () => openCommunityPost(post.id),
      actions: [
        { label: '수정', icon: Pencil, onSelect: () => openCommunityPost(post.id, true) },
        {
          label: '삭제',
          icon: Trash2,
          danger: true,
          onSelect: async () => {
            try {
              await deletePost(post.id)
              setPosts((current) => current.filter(({ id }) => id !== post.id))
              showToast('작성글을 삭제했어요')
            } catch {
              showToast('작성글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
            }
          },
        },
      ],
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      title: comment.content,
      meta: `${comment.postTitle} · ${comment.age}`,
      onClick: () => openCommunityPost(comment.postId),
      actions: [
        {
          label: '댓글 삭제',
          icon: Trash2,
          danger: true,
          onSelect: async () => {
            try {
              await deleteComment(comment.id)
              setComments((current) => current.filter(({ id }) => id !== comment.id))
              showToast('댓글을 삭제했어요')
            } catch {
              showToast('댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
            }
          },
        },
      ],
    })),
  }

  // 개수는 하드코딩하지 않고 목록 길이로 계산해요.
  const tabs: { id: ActivityTab; label: string }[] = [
    { id: 'posts', label: '작성글' },
    { id: 'comments', label: '댓글' },
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
                  onClick={row.onClick}
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
