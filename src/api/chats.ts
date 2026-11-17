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

export type ChatSummary = { id: number; title: string; updatedAt: string }
export type MainResponse = {
  chatList: ChatSummary[]
  newChat: boolean
  searchKeyword?: string | null
  page: number
  size: number
  hasNext: boolean
}

export async function getMain(params: { searchKeyword?: string; page?: number; size?: number } = {}) {
  const { data } = await client.get<MainResponse>('/api/main', { params })
  return data
}

export async function createChat(title: string) {
  const { data } = await client.post<ChatResponse>('/api/chats', { title })
  return data
}

export async function getChat(id: string, params: { messagePage?: number; messageSize?: number } = {}) {
  const { data } = await client.get<ChatResponse>(`/api/chats/${encodeURIComponent(id)}`, { params })
  return data
}

export async function sendChatMessage(
  id: string,
  content: string,
  attachmentIds: number[],
  preferences: { departmentId?: number; specialtyId?: number } = {},
) {
  const { data } = await client.post<ChatResponse>(`/api/chats/${encodeURIComponent(id)}/messages`, {
    content,
    attachmentIds,
    ...preferences,
  })
  return data
}

export async function uploadChatAttachment(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post<AttachmentDto>('/api/attachments', form)
  return data
}

export async function getAttachment(id: number) {
  const { data } = await client.get<AttachmentDto>(`/api/attachments/${id}`)
  return data
}

export async function getAttachmentContent(id: number) {
  const { data } = await client.get<Blob>(`/api/attachments/${id}/content`, { responseType: 'blob' })
  return data
}

export async function deleteAttachment(id: number) {
  await client.delete(`/api/attachments/${id}`)
}

export type LocationRequest = {
  latitude: number
  longitude: number
  horizontalAccuracyMeters: number
  measuredAt: string
  clientRequestId?: string
}

export async function sendLocationCheck(id: string, location: LocationRequest) {
  const { data } = await client.post<Record<string, unknown>>(`/api/chats/${encodeURIComponent(id)}/location-check`, location)
  return data
}
