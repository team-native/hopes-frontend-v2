export type AttachmentFormat = 'jpeg' | 'png' | 'heic' | 'pdf'

/**
 * 첨부 파일의 로컬 처리 상태. 서버 업로드 상태가 아니다.
 * - processing: 브라우저에서 파일 내용 확인(시그니처·PDF 쪽수·HEIC 미리보기) 중
 * - ready: 확인 완료, 전송 가능
 * - error: 확인 실패, 제거해야 전송 가능
 */
export type AttachmentStatus = 'processing' | 'ready' | 'error'

export type LocalAttachment = {
  id: string
  file: File
  format: AttachmentFormat
  status: AttachmentStatus
  /** URL.createObjectURL로 만든 미리보기. 소유자가 URL.revokeObjectURL로 해제해야 한다. */
  previewUrl?: string
  /** 이 브라우저가 이미지를 디코딩하지 못해 미리보기를 만들 수 없음 (주로 HEIC) */
  previewUnsupported?: boolean
  pageCount?: number
  error?: string
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
}
