import { createContext } from 'react'
import type { ChatNavigationRequest } from '../api/chats'
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
  /** navigation: 위치 질문의 목적지 선택 · 출발 위치 · 엘리베이터만 (도면 카드에서 길찾기할 때) */
  sendMessage: (
    id: string,
    content: string,
    attachments?: LocalAttachment[],
    preferences?: ChatPreferences,
    clientRequestId?: string,
    navigation?: ChatNavigationRequest,
  ) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  deleteAllConversations: () => Promise<void>
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
