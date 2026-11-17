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

/**
 * 메시지 전송 + AI 답변 (서버가 답변까지 만든 뒤 응답해서 최대 60초쯤 걸릴 수 있어요)
 * clientRequestId: 같은 질문을 다시 보낼 때 같은 값을 넘기면 서버가 한 번만 저장해요.
 * (이미 저장됐으면 저장된 대화를 그대로 돌려줘요. 내용이 다르면 409)
 */
export async function sendChatMessage(
  id: string,
  content: string,
  attachmentIds: number[],
  preferences: { departmentId?: number; specialtyId?: number } = {},
  clientRequestId?: string,
) {
  const { data } = await client.post<ChatResponse>(`/api/chats/${encodeURIComponent(id)}/messages`, {
    content,
    attachmentIds,
    ...preferences,
    clientRequestId,
  })
  return data
}

/** 대화 개별 삭제 (본인 대화가 아니거나 이미 지워졌으면 404) */
export async function deleteChat(id: string) {
  await client.delete(`/api/chats/${encodeURIComponent(id)}`)
}

/**
 * 첨부 업로드 (PNG · JPEG · PDF)
 * clientRequestId: 같은 파일을 다시 올릴 때 같은 값을 넘기면 서버가 같은 첨부를 돌려줘요.
 */
export async function uploadChatAttachment(file: File, clientRequestId?: string) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post<AttachmentDto>('/api/attachments', form, {
    params: clientRequestId ? { clientRequestId } : undefined,
  })
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

/** 대화 화면 위치 확인 응답 — 결과는 locationResult 안에 있어요 */
export type ChatLocationResponse = {
  chatId: number
  cardType: 'LOCATION'
  locationResult: {
    /** NEAR_SCHOOL · OUTSIDE · LOW_ACCURACY · UNKNOWN */
    status: string
    accuracyMeters: number
    message: string
    floorPlansAvailable: boolean
    matchedBuilding?: number | null
  }
}

export async function sendLocationCheck(id: string, location: LocationRequest) {
  const { data } = await client.post<ChatLocationResponse>(
    `/api/chats/${encodeURIComponent(id)}/location-check`,
    location,
  )
  return data
}
