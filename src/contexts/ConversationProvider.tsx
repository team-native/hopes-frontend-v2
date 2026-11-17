import { useEffect, useState, type ReactNode } from 'react'
import client from '../api/client'
import type { Conversation, LocalAttachment } from '../types/conversation'
import { createId } from '../utils/id'
import { getToken } from '../utils/token'
import { ConversationContext } from './conversationContext'

type ChatSummary = { id: number; title: string; updatedAt: string }
type MainResponse = { chatList: ChatSummary[] }

function formatAge(updatedAt: string) {
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000))
  const age = daysAgo === 0 ? '오늘' : daysAgo === 1 ? '어제' : `${daysAgo}일 전`
  return { age, daysAgo }
}

function toConversation(chat: ChatSummary): Conversation {
  return {
    id: String(chat.id),
    title: chat.title,
    preview: '',
    ...formatAge(chat.updatedAt),
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
        const { data } = await client.get<MainResponse>('/api/main', { params: { page: 0, size: 50 } })
        if (active) setConversations(data.chatList.map(toConversation))
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

  function createConversation(title: string, attachments: LocalAttachment[] = []) {
    const id = createId('conversation')
    const conversation: Conversation = { id, title, preview: '방금 시작한 대화', age: '방금', daysAgo: 0, attachments }
    setConversations((current) => [conversation, ...current])
    return id
  }

  async function deleteConversation(id: string) {
    await client.delete(`/api/chats/${encodeURIComponent(id)}`)
    setConversations((current) => {
      const target = current.find((conversation) => conversation.id === id)
      if (target) revokePreviews(target)
      return current.filter((conversation) => conversation.id !== id)
    })
  }

  return (
    <ConversationContext.Provider value={{ conversations, getConversation, createConversation, deleteConversation }}>
      {children}
    </ConversationContext.Provider>
  )
}
