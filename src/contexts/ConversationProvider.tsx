import axios from 'axios'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  createChat,
  deleteChat,
  getChat,
  getMain,
  sendChatMessage,
  type ChatMessage,
  type ChatResponse,
} from '../api/chats'
import { updateSettings } from '../api/settings'
import type { Conversation, LocalAttachment } from '../types/conversation'
import { getToken } from '../utils/token'
import { ConversationContext, type ChatPreferences } from './conversationContext'

function formatAge(updatedAt: string) {
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000))
  const age = daysAgo === 0 ? '오늘' : daysAgo === 1 ? '어제' : `${daysAgo}일 전`
  return { age, daysAgo }
}

function toConversation(chat: ChatResponse, attachments: LocalAttachment[] = []): Conversation {
  const lastMessage = chat.messages.at(-1)
  const timestamp = lastMessage?.createdAt
  return {
    id: String(chat.id),
    title: chat.title,
    preview: lastMessage?.content ?? '',
    ...(timestamp ? formatAge(timestamp) : { age: '방금', daysAgo: 0 }),
    attachments,
    messages: chat.messages,
    messagePage: chat.messagePage,
    hasMoreMessages: chat.hasMoreMessages,
  }
}

/**
 * 서버 응답(최근 50개)으로 대화를 바꾸되, 이미 불러온 더 오래된 메시지는 앞에 남겨 둬요.
 * (임시로 넣은 내 메시지(id < 0)는 서버 응답으로 대체돼요)
 */
function mergeLatest(previous: Conversation | undefined, chat: ChatResponse, attachments: LocalAttachment[]) {
  const latest = toConversation(chat, attachments)
  const latestIds = new Set(chat.messages.map(({ id }) => id))
  const oldestLatestId = chat.messages[0]?.id ?? Number.POSITIVE_INFINITY
  const older = (previous?.messages ?? []).filter(({ id }) => id > 0 && !latestIds.has(id) && id < oldestLatestId)
  if (!older.length) return latest
  return {
    ...latest,
    messages: [...older, ...(latest.messages ?? [])],
    messagePage: previous?.messagePage ?? latest.messagePage,
    hasMoreMessages: previous?.hasMoreMessages ?? latest.hasMoreMessages,
  }
}

function revokePreviews(conversation: Conversation) {
  conversation.attachments?.forEach(({ previewUrl }) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  })
}

/** 입력창 첨부 → 서버 첨부 id. 아직 안 올라간 첨부가 있으면 보내지 않아요 */
function toAttachmentIds(attachments: LocalAttachment[]) {
  const ids = attachments.map(({ serverId }) => serverId)
  if (ids.some((id) => id === undefined)) throw new Error('ATTACHMENT_NOT_UPLOADED')
  return ids as number[]
}

function optimisticUserMessage(content: string): ChatMessage {
  return {
    id: -Date.now(),
    role: 'USER',
    content,
    createdAt: new Date().toISOString(),
    attachments: [],
    contentFormat: 'TEXT',
  }
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    let active = true
    const loadConversations = async () => {
      if (!getToken()) {
        setConversations([])
        return
      }
      try {
        const data = await getMain({ page: 0, size: 50 })
        if (active) {
          // 목록 응답보다 대화(GET /api/chats/{id})가 먼저 도착했을 수 있어요 (주소로 바로 열거나 새로고침).
          // 이미 불러온 메시지 · 첨부는 지우지 않고 제목 · 시간만 목록 값으로 맞춰요.
          setConversations((current) =>
            data.chatList.map((chat) => {
              const summary = { id: String(chat.id), title: chat.title, ...formatAge(chat.updatedAt) }
              const loaded = current.find((item) => item.id === summary.id)
              return loaded ? { ...loaded, ...summary } : { ...summary, preview: '', messages: [] }
            }),
          )
        }
      } catch {
        if (active) setConversations([])
      }
    }
    const onLogout = () => setConversations([])
    window.addEventListener('hopes:authenticated', loadConversations)
    window.addEventListener('hopes:logged-out', onLogout)
    void loadConversations()
    return () => {
      active = false
      window.removeEventListener('hopes:authenticated', loadConversations)
      window.removeEventListener('hopes:logged-out', onLogout)
    }
  }, [])

  function getConversation(id: string) {
    return conversations.find((conversation) => conversation.id === id)
  }

  const searchConversations = useCallback(async (keyword: string) => {
    const data = await getMain({ searchKeyword: keyword, page: 0, size: 50 })
    return data.chatList.map((chat) => ({
      id: String(chat.id),
      title: chat.title,
      preview: '',
      ...formatAge(chat.updatedAt),
      messages: [],
    }))
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    const chat = await getChat(id)
    const conversation = toConversation(chat)
    setConversations((current) => [
      { ...conversation, attachments: current.find((item) => item.id === id)?.attachments ?? [] },
      ...current.filter((item) => item.id !== id),
    ])
  }, [])

  const loadOlderMessages = useCallback(
    async (id: string) => {
      const current = conversations.find((item) => item.id === id)
      if (!current?.hasMoreMessages) return
      const nextPage = (current.messagePage ?? 0) + 1
      const chat = await getChat(id, { messagePage: nextPage })
      setConversations((list) =>
        list.map((item) => {
          if (item.id !== id) return item
          // 그사이 새 메시지가 생기면 페이지가 밀려 겹칠 수 있어서 id로 중복을 걸러요
          const knownIds = new Set((item.messages ?? []).map(({ id: messageId }) => messageId))
          return {
            ...item,
            messages: [
              ...chat.messages.filter(({ id: messageId }) => !knownIds.has(messageId)),
              ...(item.messages ?? []),
            ],
            messagePage: nextPage,
            hasMoreMessages: chat.hasMoreMessages,
          }
        }),
      )
    },
    [conversations],
  )

  async function createConversation(
    title: string,
    attachments: LocalAttachment[] = [],
    preferences: ChatPreferences = {},
    onCreated?: (id: string) => void,
    clientRequestId?: string,
  ) {
    const attachmentIds = toAttachmentIds(attachments)
    const chat = await createChat(title)
    const id = String(chat.id)
    const optimisticConversation: Conversation = {
      id,
      title: chat.title,
      preview: title,
      age: '방금',
      daysAgo: 0,
      attachments,
      messages: [optimisticUserMessage(title)],
    }
    setConversations((current) => [optimisticConversation, ...current.filter((item) => item.id !== id)])
    onCreated?.(id)
    try {
      const response = await sendChatMessage(id, title, attachmentIds, preferences, clientRequestId)
      setConversations((current) => [
        toConversation(response, attachments),
        ...current.filter((item) => item.id !== id),
      ])
    } catch (error) {
      // 대화는 만들어졌으니 남겨 두고, 보내지 못한 질문만 지워요 (대화 화면에서 다시 보낼 수 있어요)
      setConversations((current) =>
        current.map((item) => (item.id === id ? { ...optimisticConversation, messages: [] } : item)),
      )
      throw error
    }
    return id
  }

  async function sendMessage(
    id: string,
    content: string,
    attachments: LocalAttachment[] = [],
    preferences: ChatPreferences = {},
    clientRequestId?: string,
  ) {
    const previous = getConversation(id)
    if (!previous) throw new Error('CONVERSATION_NOT_FOUND')
    const attachmentIds = toAttachmentIds(attachments)
    const allAttachments = [...(previous.attachments ?? []), ...attachments]
    const optimistic = optimisticUserMessage(content)
    setConversations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              preview: content,
              attachments: allAttachments,
              messages: [...(item.messages ?? []), optimistic],
            }
          : item,
      ),
    )
    try {
      const response = await sendChatMessage(id, content, attachmentIds, preferences, clientRequestId)
      setConversations((current) => {
        const latest = current.find((item) => item.id === id)
        return [mergeLatest(latest, response, allAttachments), ...current.filter((item) => item.id !== id)]
      })
    } catch (error) {
      // 보내기 전 상태로 통째로 되돌리면 기다리는 사이 불러온 이전 메시지까지 사라져요.
      // 방금 넣은 임시 메시지 · 첨부 · 미리보기 문구만 빼요.
      const addedIds = new Set(attachments.map(({ id: attachmentId }) => attachmentId))
      setConversations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                preview: previous.preview,
                attachments: (item.attachments ?? []).filter(({ id: attachmentId }) => !addedIds.has(attachmentId)),
                messages: (item.messages ?? []).filter(({ id: messageId }) => messageId !== optimistic.id),
              }
            : item,
        ),
      )
      throw error
    }
  }

  async function deleteConversation(id: string) {
    try {
      await deleteChat(id)
    } catch (error) {
      // 이미 지워졌거나 내 대화가 아니면(404) 목록에서만 빼요
      if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error
    }
    setConversations((current) => {
      const target = current.find((conversation) => conversation.id === id)
      if (target) revokePreviews(target)
      return current.filter((conversation) => conversation.id !== id)
    })
  }

  async function deleteAllConversations() {
    await updateSettings({ deleteAllChats: true })
    setConversations((current) => {
      current.forEach(revokePreviews)
      return []
    })
  }

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        getConversation,
        searchConversations,
        loadConversation,
        loadOlderMessages,
        createConversation,
        sendMessage,
        deleteConversation,
        deleteAllConversations,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}
