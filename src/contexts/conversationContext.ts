import { createContext } from 'react'
import type { Conversation, LocalAttachment } from '../types/conversation'

export type ConversationContextValue = {
  conversations: Conversation[]
  getConversation: (id: string) => Conversation | undefined
  loadConversation: (id: string) => Promise<void>
  createConversation: (
    title: string,
    attachments?: LocalAttachment[],
    onCreated?: (id: string) => void,
  ) => Promise<string>
  sendMessage: (id: string, content: string, attachments?: LocalAttachment[]) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
