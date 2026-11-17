import { createContext } from 'react'
import type { Conversation, LocalAttachment } from '../types/conversation'

export type ConversationContextValue = {
  conversations: Conversation[]
  getConversation: (id: string) => Conversation | undefined
  searchConversations: (keyword: string) => Promise<Conversation[]>
  loadConversation: (id: string) => Promise<void>
  createConversation: (
    title: string,
    attachments?: LocalAttachment[],
    preferences?: { departmentId?: number; specialtyId?: number },
    onCreated?: (id: string) => void,
  ) => Promise<string>
  sendMessage: (
    id: string,
    content: string,
    attachments?: LocalAttachment[],
    preferences?: { departmentId?: number; specialtyId?: number },
  ) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  deleteAllConversations: () => Promise<void>
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
