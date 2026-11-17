import client from './client'

export type AttachmentDto = {
  id: number
  fileName: string
  mimeType: string
  sizeBytes: number
  status: string
  previewUrl?: string | null
  type: string
  expiresAt: string
}

export type ChatMessage = {
  id: number
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
  attachments: AttachmentDto[]
  analysisStatus?: string | null
  contentFormat: string
}

export type ChatResponse = {
  id: number
  title: string
  messages: ChatMessage[]
  messagePage: number
  messageSize: number
  hasMoreMessages: boolean
}

export async function createChat(title: string) {
  const { data } = await client.post<ChatResponse>('/api/chats', { title })
  return data
}

export async function getChat(id: string) {
  const { data } = await client.get<ChatResponse>(`/api/chats/${encodeURIComponent(id)}`)
  return data
}

export async function sendChatMessage(id: string, content: string, attachmentIds: number[]) {
  const { data } = await client.post<ChatResponse>(`/api/chats/${encodeURIComponent(id)}/messages`, {
    content,
    attachmentIds,
  })
  return data
}

export async function uploadChatAttachment(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post<AttachmentDto>('/api/attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
