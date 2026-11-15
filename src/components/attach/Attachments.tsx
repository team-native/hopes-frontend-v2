import { FileText, ImageIcon, X } from 'lucide-react'

/** 첨부 지우기 버튼 (검은 원 + X) */
function RemoveBadge({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-bg-inverse text-icon-on-brand ring-2 ring-bg-surface"
    >
      <X className="size-3" strokeWidth={2.5} aria-hidden />
    </button>
  )
}

interface ImageThumbProps {
  /** 이미지 주소 (없으면 이미지 아이콘) */
  src?: string
  alt?: string
  onRemove?: () => void
}

/** 첨부 이미지 썸네일 (Attach/Image Thumb) */
export function ImageThumb({ src, alt = '첨부 이미지', onRemove }: ImageThumbProps) {
  return (
    <div className="relative size-14 shrink-0">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-sm border border-border-subtle bg-bg-surface">
        {src ? (
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 text-icon-brand" strokeWidth={1.75} aria-label={alt} />
        )}
      </div>
      {onRemove && <RemoveBadge label="이미지 빼기" onClick={onRemove} />}
    </div>
  )
}

interface PdfCardProps {
  name: string
  /** 쪽 수 */
  pages?: number
  onRemove?: () => void
}

/** 첨부 PDF 카드 — 이름 + "PDF · 12쪽" + X (Attach/PDF Card) */
export function PdfCard({ name, pages, onRemove }: PdfCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-md border border-border-subtle bg-bg-surface py-2 pr-2 pl-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-bg-brand-soft text-icon-brand"
        aria-hidden
      >
        <FileText className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-strong">{name}</p>
        <p className="text-[11px] text-text-tertiary">PDF{pages ? ` · ${pages}쪽` : ''}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${name} 빼기`}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
  )
}

interface PdfChipProps {
  name: string
  onClick?: () => void
}

/** 말풍선 안에 붙는 작은 PDF 표시 (Attach/PDF Chip) */
export function PdfChip({ name, onClick }: PdfChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border-subtle bg-bg-surface px-3 py-2 shadow-cloud-sm transition hover:border-border-brand"
    >
      <FileText className="size-4 shrink-0 text-icon-brand" strokeWidth={1.75} aria-hidden />
      <span className="truncate text-caption font-semibold">{name}</span>
    </button>
  )
}
