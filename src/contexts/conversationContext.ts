import { createContext } from 'react'
import type { Conversation, LocalAttachment } from '../types/conversation'

export type ChatPreferences = { departmentId?: number; specialtyId?: number }

export type ConversationContextValue = {
  conversations: Conversation[]
  getConversation: (id: string) => Conversation | undefined
  searchConversations: (keyword: string) => Promise<Conversation[]>
  /** 대화의 최근 메시지 50개를 불러와요 (GET /api/chats/{id}) */
  loadConversation: (id: string) => Promise<void>
  /** 더 오래된 메시지 50개를 앞에 붙여요 (messagePage + 1) */
  loadOlderMessages: (id: string) => Promise<void>
  /**
   * 새 대화를 만들고 첫 질문을 보내요.
   * attachments는 서버에 올라간(serverId 있는) 첨부여야 해요. clientRequestId는 재시도 키예요.
   */
  createConversation: (
    title: string,
    attachments?: LocalAttachment[],
    preferences?: ChatPreferences,
    onCreated?: (id: string) => void,
    clientRequestId?: string,
  ) => Promise<string>
  sendMessage: (
    id: string,
    content: string,
    attachments?: LocalAttachment[],
    preferences?: ChatPreferences,
    clientRequestId?: string,
  ) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  deleteAllConversations: () => Promise<void>
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
