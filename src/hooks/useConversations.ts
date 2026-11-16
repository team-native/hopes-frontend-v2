import { useContext } from 'react'
import { ConversationContext } from '../contexts/conversationContext'

function useConversations() {
  const context = useContext(ConversationContext)
  if (!context) throw new Error('useConversations는 ConversationProvider 안에서 사용해야 해요.')
  return context
}

export default useConversations
