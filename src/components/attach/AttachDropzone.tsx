import { Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import Button from '../common/Button'
import IconButton from '../common/IconButton'

interface AttachDropzoneProps {
  open: boolean
  onClose: () => void
  /** 파일을 놓거나 고른 뒤 호출 */
  onFiles: (files: FileList) => void
  /** input accept 값 (예: ".jpg,.png,.pdf") */
  accept?: string
  description?: string
}

/**
 * 파일을 끌어다 놓는 영역 — 감싸는 요소(relative)를 덮어요
 * "파일 선택" 버튼으로 직접 고를 수도 있어요.
 */
function AttachDropzone({
  open,
  onClose,
  onFiles,
  accept,
  description = '이미지(JPG·PNG·HEIC)와 PDF를 첨부할 수 있어요',
}: AttachDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  if (!open) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-brand-soft/85 p-5 backdrop-blur-[1px] md:p-8">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.currentTarget.files?.length) onFiles(event.currentTarget.files)
          event.currentTarget.value = ''
        }}
      />
      {/* IconButton 자체가 relative라 위치는 감싸는 칸으로 잡아요 */}
      <div className="absolute top-4 right-4">
        <IconButton icon={X} label="첨부 닫기" variant="boxed" onClick={onClose} />
      </div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files)
        }}
        className={`flex h-[min(42vh,320px)] w-full max-w-[664px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-brand px-5 text-center transition ${
          dragActive ? 'bg-bg-brand-soft' : 'bg-bg-surface/75'
        }`}
      >
        <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-bg-brand-soft text-icon-brand">
          <Upload className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="text-body-strong">여기에 놓으면 첨부돼요</h2>
        <p className="mt-2 text-caption text-text-secondary">{description}</p>
        <Button size="sm" variant="secondary" className="mt-md" onClick={() => inputRef.current?.click()}>
          파일 선택
        </Button>
      </div>
    </div>
  )
}

export default AttachDropzone
