import { useState, type ReactNode } from 'react'
import { mockConversations } from '../mocks/conversations'
import type { Conversation, LocalAttachment } from '../types/conversation'
import { createId } from '../utils/id'
import { ConversationContext } from './conversationContext'

function revokePreviews(conversation: Conversation) {
  conversation.attachments?.forEach(({ previewUrl }) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  })
}

// 사이드바 최근 대화·기록·마이페이지 통계가 같은 대화 목록을 보도록 앱 전역에서 관리한다.
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState(mockConversations)

  function getConversation(id: string) {
    return conversations.find((conversation) => conversation.id === id)
  }

  function createConversation(title: string, attachments: LocalAttachment[] = []) {
    // TODO: 대화 생성 API 연동 후 서버가 발급한 ID 사용
    const id = createId('conversation')
    const conversation: Conversation = { id, title, preview: '방금 시작한 대화', age: '방금', daysAgo: 0, attachments }
    setConversations((current) => [conversation, ...current])
    return id
  }

  function deleteConversation(id: string) {
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
