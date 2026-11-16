import { MessageCircle, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import IconButton from '../../components/common/IconButton'
import { ListCard, ListRow } from '../../components/common/ListRow'
import SearchField from '../../components/common/SearchField'
import { EmptyState } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import SectionHeader from '../../components/layout/SectionHeader'
import useAppNavigation from '../../hooks/useAppNavigation'
import useConversations from '../../hooks/useConversations'
import type { Conversation } from '../../types/conversation'

const RECENT_DAYS = 7

function HistoryPage() {
  const { startNewChat, openConversation } = useAppNavigation()
  const { conversations, deleteConversation } = useConversations()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)

  const query = search.trim().toLocaleLowerCase()
  const filtered = useMemo(() => {
    if (!query) return conversations
    return conversations.filter(({ title, preview }) => `${title} ${preview}`.toLocaleLowerCase().includes(query))
  }, [conversations, query])

  // 검색 중에는 기간으로 나누지 않고 한 묶음으로 보여 줘요.
  const groups: { title: string; conversations: Conversation[] }[] = query
    ? [{ title: `검색 결과 ${filtered.length}개`, conversations: filtered }]
    : [
        { title: '지난 7일', conversations: filtered.filter(({ daysAgo }) => daysAgo <= RECENT_DAYS) },
        { title: '이전', conversations: filtered.filter(({ daysAgo }) => daysAgo > RECENT_DAYS) },
      ].filter((group) => group.conversations.length > 0)

  function confirmDelete() {
    if (!deleteTarget) return
    deleteConversation(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <AppLayout activeMenu="history">
      <main className="mx-auto w-full max-w-[900px] px-5 pt-5 pb-10 md:px-8 md:pt-6">
        <header className="mb-lg flex items-start justify-between gap-md">
          <div>
            <h1 className="text-title">대화 기록</h1>
            <p className="mt-1 text-label text-text-secondary">이전 대화를 이어서 볼 수 있어요.</p>
          </div>
          <Button size="sm" onClick={startNewChat}>
            새 대화
          </Button>
        </header>

        <SearchField value={search} onChange={setSearch} placeholder="지난 대화 검색" />

        {filtered.length === 0 ? (
          <div className="py-4xl">
            {query ? (
              <EmptyState icon={Search} title="검색 결과가 없어요" description="다른 검색어로 다시 찾아보세요." />
            ) : (
              <EmptyState
                title="아직 대화가 없어요"
                description="선배에게 첫 질문을 해보세요."
                actionText="채팅 시작하기"
                onAction={startNewChat}
              />
            )}
          </div>
        ) : (
          <div className="mt-lg space-y-lg">
            {groups.map((group) => (
              <section key={group.title} className="space-y-xs">
                <SectionHeader title={group.title} />
                <ListCard>
                  {group.conversations.map((conversation) => (
                    <ListRow
                      key={conversation.id}
                      icon={MessageCircle}
                      title={conversation.title}
                      description={conversation.preview}
                      meta={conversation.age}
                      onClick={() => openConversation(conversation.id)}
                      trailing={
                        <IconButton
                          icon={Trash2}
                          label={`${conversation.title} 삭제`}
                          onClick={() => setDeleteTarget(conversation)}
                          className="size-8 text-icon-muted"
                        />
                      }
                    />
                  ))}
                </ListCard>
              </section>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 대화를 삭제할까요?"
        description={
          <>
            <p className="line-clamp-1">{deleteTarget?.title}</p>
            {/* TODO: 대화 삭제 API 연동 후 "삭제한 대화는 되돌릴 수 없어요."로 바꾸기 */}
            <p className="mt-1 text-caption text-text-tertiary">
              목업 단계라 이 화면에서만 지워지고, 새로고침하면 다시 나타나요.
            </p>
          </>
        }
        confirmText="삭제"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}

export default HistoryPage
