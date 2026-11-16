import type { PDFDocumentLoadingTask } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import type { LocalAttachment } from '../types/conversation'
import { MAX_ATTACHMENT_COUNT, canDisplayImage, checkAttachmentFile, matchesFileSignature } from '../utils/attachments'
import { createId } from '../utils/id'

/**
 * 채팅 입력창에서 보내기 전까지 고른 첨부 파일을 관리해요 (새 대화 · 대화 화면 공통)
 * - 형식 · 용량 · 개수 확인, 파일 내용(시그니처) 확인, PDF 쪽수 읽기, 이미지 미리보기 URL
 * - 브라우저 안에서만 하는 확인 작업이에요. 서버 업로드는 하지 않아요.
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
    const acceptedFiles = validFiles.slice(0, remainingSlots)

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
      setError('이미지(JPG·PNG·HEIC)와 PDF만 첨부할 수 있어요.')
    } else if (checks.some(({ check }) => !check.ok && check.reason === 'size')) {
      setError('파일당 최대 20MB까지 첨부할 수 있어요.')
    } else if (validFiles.length > remainingSlots) {
      setError(`한 번에 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부할 수 있어요.`)
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
        updateAttachment(id, { status: 'ready', pageCount: pdf.numPages })
        return
      }

      if (format === 'heic') {
        const url = URL.createObjectURL(file)
        const displayable = await canDisplayImage(url)
        if (signal.aborted || !displayable) {
          URL.revokeObjectURL(url)
          if (!signal.aborted) updateAttachment(id, { status: 'ready', previewUnsupported: true })
          return
        }
        ownedPreviewUrlsRef.current.set(id, url)
        updateAttachment(id, { status: 'ready', previewUrl: url })
        return
      }

      // JPG·PNG는 모든 브라우저가 표시할 수 있어 확인이 끝나면 바로 미리보기를 만든다.
      const previewUrl = URL.createObjectURL(file)
      ownedPreviewUrlsRef.current.set(id, previewUrl)
      updateAttachment(id, { status: 'ready', previewUrl })
    } catch {
      if (signal.aborted) return
      updateAttachment(id, {
        status: 'error',
        error: format === 'pdf' ? 'PDF를 읽지 못했어요. 파일을 확인해 주세요.' : '파일을 읽지 못했어요.',
      })
    } finally {
      // 쪽수만 필요하므로 성공·실패·취소와 관계없이 PDF 문서와 워커 리소스를 정리한다.
      signal.removeEventListener('abort', destroyPdfTask)
      destroyPdfTask()
    }
  }

  function removeAttachment(id: string) {
    processingJobsRef.current.get(id)?.abort()
    processingJobsRef.current.delete(id)
    const previewUrl = ownedPreviewUrlsRef.current.get(id)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    ownedPreviewUrlsRef.current.delete(id)
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
    /** 확인 중이거나 오류인 첨부가 있으면 true (보내기 막음) */
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
