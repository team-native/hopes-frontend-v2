import { createContext } from 'react'
import type { Conversation, LocalAttachment } from '../types/conversation'

export type ConversationContextValue = {
  conversations: Conversation[]
  getConversation: (id: string) => Conversation | undefined
  createConversation: (title: string, attachments?: LocalAttachment[]) => string
  deleteConversation: (id: string) => void
}

export const ConversationContext = createContext<ConversationContextValue | null>(null)
