import { useCallback, useEffect, useState, type ReactNode } from 'react'
import client from '../api/client'
import { createChat, getChat, getMain, sendChatMessage, uploadChatAttachment, type ChatResponse } from '../api/chats'
import { updateSettings } from '../api/settings'
import type { Conversation, LocalAttachment } from '../types/conversation'
import { getToken } from '../utils/token'
import { ConversationContext } from './conversationContext'

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
  }
}

function revokePreviews(conversation: Conversation) {
  conversation.attachments?.forEach(({ previewUrl }) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  })
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
          setConversations(
            data.chatList.map((chat) => ({
              id: String(chat.id),
              title: chat.title,
              preview: '',
              ...formatAge(chat.updatedAt),
              messages: [],
            })),
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

  async function createConversation(
    title: string,
    attachments: LocalAttachment[] = [],
    preferences: { departmentId?: number; specialtyId?: number } = {},
    onCreated?: (id: string) => void,
  ) {
    const uploaded = await Promise.all(attachments.map(({ file }) => uploadChatAttachment(file)))
    const chat = await createChat(title)
    const id = String(chat.id)
    const optimisticMessage: ChatResponse['messages'][number] = {
      id: -Date.now(),
      role: 'USER',
      content: title,
      createdAt: new Date().toISOString(),
      attachments: [],
      contentFormat: 'TEXT',
    }
    const optimisticConversation: Conversation = {
      id,
      title: chat.title,
      preview: title,
      age: '방금',
      daysAgo: 0,
      attachments,
      messages: [optimisticMessage],
    }
    setConversations((current) => [optimisticConversation, ...current.filter((item) => item.id !== id)])
    onCreated?.(id)
    try {
      const response = await sendChatMessage(
        id,
        title,
        uploaded.map(({ id: attachmentId }) => attachmentId),
        preferences,
      )
      const conversation = toConversation(response, attachments)
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== id)])
    } catch (error) {
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
    preferences: { departmentId?: number; specialtyId?: number } = {},
  ) {
    const previous = getConversation(id)
    if (!previous) throw new Error('CONVERSATION_NOT_FOUND')
    const optimisticMessage: ChatResponse['messages'][number] = {
      id: -Date.now(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
      attachments: [],
      contentFormat: 'TEXT',
    }
    const allAttachments = [...(previous.attachments ?? []), ...attachments]
    setConversations((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              preview: content,
              attachments: allAttachments,
              messages: [...(item.messages ?? []), optimisticMessage],
            }
          : item,
      ),
    )
    try {
      const uploaded = await Promise.all(attachments.map(({ file }) => uploadChatAttachment(file)))
      const response = await sendChatMessage(
        id,
        content,
        uploaded.map(({ id: attachmentId }) => attachmentId),
        preferences,
      )
      const conversation = toConversation(response, allAttachments)
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== id)])
    } catch (error) {
      setConversations((current) => current.map((item) => (item.id === id ? previous : item)))
      throw error
    }
  }

  async function deleteConversation(id: string) {
    await client.delete(`/api/chats/${encodeURIComponent(id)}`)
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
      value={{ conversations, getConversation, searchConversations, loadConversation, createConversation, sendMessage, deleteConversation, deleteAllConversations }}
    >
      {children}
    </ConversationContext.Provider>
  )
}
