export type AttachmentFormat = 'jpeg' | 'png' | 'pdf'

/**
 * 입력창 첨부의 상태
 * - processing: 브라우저 확인(시그니처 · PDF 쪽수) 또는 서버 업로드 중
 * - ready: 서버 업로드까지 끝나 전송 가능 (serverId 있음)
 * - error: 확인 · 업로드 실패, 제거해야 전송 가능
 */
export type AttachmentStatus = 'processing' | 'ready' | 'error'

export type LocalAttachment = {
  id: string
  file: File
  format: AttachmentFormat
  status: AttachmentStatus
  /** URL.createObjectURL로 만든 미리보기. 소유자가 URL.revokeObjectURL로 해제해야 한다. */
  previewUrl?: string
  pageCount?: number
  error?: string
  /** 서버에 올라간 첨부 id (POST /api/attachments 응답). 메시지를 보낼 때 attachmentIds로 넘겨요 */
  serverId?: number
}

export type Conversation = {
  id: string
  title: string
  preview: string
  age: string
  daysAgo: number
  /** 전송된 첨부. previewUrl은 이 대화가 소유하며 대화 삭제 시 해제된다. */
  attachments?: LocalAttachment[]
  messages?: import('../api/chats').ChatMessage[]
  /** 지금까지 불러온 가장 오래된 메시지 페이지 (0 = 최근 50개) */
  messagePage?: number
  /** 더 오래된 메시지가 서버에 남아 있는지 */
  hasMoreMessages?: boolean
}
