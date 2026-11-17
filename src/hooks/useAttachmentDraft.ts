import type { PDFDocumentLoadingTask } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import { deleteAttachment, uploadChatAttachment } from '../api/chats'
import type { LocalAttachment } from '../types/conversation'
import {
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_TOTAL_SIZE,
  MAX_PDF_PAGES,
  checkAttachmentFile,
  matchesFileSignature,
} from '../utils/attachments'
import { getApiErrorMessage } from '../utils/error'
import { createId } from '../utils/id'

/**
 * 채팅 입력창에서 보내기 전까지 고른 첨부 파일을 관리해요 (새 대화 · 대화 화면 공통)
 * 1. 브라우저에서 형식 · 용량 · 개수 · 파일 내용(시그니처) · PDF 쪽수를 먼저 확인해요.
 * 2. 통과하면 바로 서버에 올려요(POST /api/attachments). 서버가 거절하면 그 파일에 이유를 보여 줘요.
 * 3. 보내기를 누르면 올라간 첨부 id(serverId)만 메시지에 붙여요.
 * 4. 보내기 전에 지운 첨부는 서버에서도 지워요(DELETE /api/attachments/{id}).
 */
function useAttachmentDraft() {
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [error, setError] = useState('')
  const [dropzoneOpen, setDropzoneOpen] = useState(false)
  // 첨부 리소스 소유권: 전송 전까지는 이 입력창이 소유하고, 제거·화면 종료 시 해제한다.
  // 전송하면 미리보기 URL의 소유권은 대화(ConversationProvider)로 넘어간다.
  const processingJobsRef = useRef(new Map<string, AbortController>())
  const ownedPreviewUrlsRef = useRef(new Map<string, string>())

  useEffect(() => {
    const jobs = processingJobsRef.current
    const previewUrls = ownedPreviewUrlsRef.current
    return () => {
      jobs.forEach((job) => job.abort())
      jobs.clear()
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.clear()
    }
  }, [])

  function updateAttachment(id: string, changes: Partial<LocalAttachment>) {
    setAttachments((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList)
    const checks = incomingFiles.map((file) => ({ file, check: checkAttachmentFile(file) }))
    const validFiles = checks.flatMap(({ file, check }) => (check.ok ? [{ file, format: check.format }] : []))
    const remainingSlots = Math.max(0, MAX_ATTACHMENT_COUNT - attachments.length)
    // 합계 용량(12MB)을 넘기는 파일부터는 받지 않아요
    let totalSize = attachments.reduce((sum, { file }) => sum + file.size, 0)
    const acceptedFiles = validFiles.slice(0, remainingSlots).filter(({ file }) => {
      if (totalSize + file.size > MAX_ATTACHMENT_TOTAL_SIZE) return false
      totalSize += file.size
      return true
    })

    // 미리보기 URL은 파일 시그니처 확인을 통과한 뒤에 만든다 (이름만 바꾼 파일은 미리보기를 만들지 않음)
    const newAttachments: LocalAttachment[] = acceptedFiles.map(({ file, format }) => ({
      id: createId('attachment'),
      file,
      format,
      status: 'processing',
    }))
    setAttachments((current) => [...current, ...newAttachments])
    newAttachments.forEach((attachment) => {
      const job = new AbortController()
      processingJobsRef.current.set(attachment.id, job)
      void processAttachment(attachment, job.signal).finally(() => {
        if (processingJobsRef.current.get(attachment.id) === job) processingJobsRef.current.delete(attachment.id)
      })
    })

    if (checks.some(({ check }) => !check.ok && check.reason === 'type')) {
      setError('이미지(JPG·PNG)와 PDF만 첨부할 수 있어요.')
    } else if (checks.some(({ check }) => !check.ok && check.reason === 'size')) {
      setError('파일당 최대 5MB까지 첨부할 수 있어요.')
    } else if (validFiles.length > remainingSlots) {
      setError(`한 번에 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부할 수 있어요.`)
    } else if (acceptedFiles.length < Math.min(validFiles.length, remainingSlots)) {
      setError('첨부 파일은 합쳐서 12MB까지 보낼 수 있어요.')
    } else {
      setError('')
    }

    setDropzoneOpen(false)
  }

  async function processAttachment(attachment: LocalAttachment, signal: AbortSignal) {
    const { id, file, format } = attachment
    let pdfTask: PDFDocumentLoadingTask | undefined
    const destroyPdfTask = () => {
      void pdfTask?.destroy().catch(() => undefined)
    }

    // 1) 브라우저 확인
    let localChanges: Partial<LocalAttachment> = {}
    try {
      const signatureMatches = await matchesFileSignature(file, format)
      if (signal.aborted) return
      if (!signatureMatches) {
        updateAttachment(id, { status: 'error', error: '파일 내용이 형식과 맞지 않아요.' })
        return
      }

      if (format === 'pdf') {
        // pdf.js(약 440KB + 워커)는 PDF를 첨부했을 때만 내려받아요.
        const pdfjsLib = await import('pdfjs-dist')
        if (signal.aborted) return
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
        const data = await file.arrayBuffer()
        if (signal.aborted) return
        pdfTask = pdfjsLib.getDocument({ data })
        signal.addEventListener('abort', destroyPdfTask, { once: true })
        const pdf = await pdfTask.promise
        if (signal.aborted) return
        if (pdf.numPages > MAX_PDF_PAGES) {
          updateAttachment(id, {
            status: 'error',
            pageCount: pdf.numPages,
            error: `PDF는 ${MAX_PDF_PAGES}쪽까지 첨부할 수 있어요.`,
          })
          return
        }
        localChanges = { pageCount: pdf.numPages }
      } else {
        // JPG·PNG는 모든 브라우저가 표시할 수 있어 확인이 끝나면 바로 미리보기를 만든다.
        const previewUrl = URL.createObjectURL(file)
        ownedPreviewUrlsRef.current.set(id, previewUrl)
        localChanges = { previewUrl }
      }
      updateAttachment(id, localChanges)
    } catch {
      if (signal.aborted) return
      updateAttachment(id, {
        status: 'error',
        error: format === 'pdf' ? 'PDF를 읽지 못했어요. 파일을 확인해 주세요.' : '파일을 읽지 못했어요.',
      })
      return
    } finally {
      // 쪽수만 필요하므로 성공·실패·취소와 관계없이 PDF 문서와 워커 리소스를 정리한다.
      signal.removeEventListener('abort', destroyPdfTask)
      destroyPdfTask()
    }

    // 2) 서버 업로드 — 로컬 id를 재시도 키로 써서, 같은 파일을 다시 올려도 서버에 하나만 남아요
    try {
      const uploaded = await uploadChatAttachment(file, id)
      if (signal.aborted) {
        // 올리는 중에 지웠으면 서버에서도 지워요
        void deleteAttachment(uploaded.id).catch(() => undefined)
        return
      }
      updateAttachment(id, { status: 'ready', serverId: uploaded.id })
    } catch (uploadError) {
      if (signal.aborted) return
      updateAttachment(id, { status: 'error', error: getApiErrorMessage(uploadError, '파일을 올리지 못했어요.') })
    }
  }

  function removeAttachment(id: string) {
    processingJobsRef.current.get(id)?.abort()
    processingJobsRef.current.delete(id)
    const previewUrl = ownedPreviewUrlsRef.current.get(id)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    ownedPreviewUrlsRef.current.delete(id)
    const serverId = attachments.find((attachment) => attachment.id === id)?.serverId
    // 아직 메시지에 붙지 않은 첨부라 서버에서도 지워요 (실패해도 30일 뒤 서버가 정리해요)
    if (serverId !== undefined) void deleteAttachment(serverId).catch(() => undefined)
    setAttachments((current) => current.filter((attachment) => attachment.id !== id))
    setError('')
  }

  /** 전송 뒤 호출 — 미리보기 URL은 대화가 소유하므로 해제하지 않고 소유 목록에서만 빼요 */
  function handOff() {
    processingJobsRef.current.clear()
    ownedPreviewUrlsRef.current.clear()
    setAttachments([])
    setError('')
  }

  return {
    attachments,
    error,
    /** 확인 · 업로드 중이거나 오류인 첨부가 있으면 true (보내기 막음) */
    hasUnready: attachments.some(({ status }) => status !== 'ready'),
    dropzoneOpen,
    openDropzone: () => setDropzoneOpen(true),
    closeDropzone: () => setDropzoneOpen(false),
    addFiles,
    removeAttachment,
    handOff,
  }
}

export default useAttachmentDraft
