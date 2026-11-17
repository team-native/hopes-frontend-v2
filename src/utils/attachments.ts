import type { AttachmentFormat } from '../types/conversation'

// 클라이언트 검증은 사용자 피드백용이다. 최종 검증은 반드시 서버에서 다시 한다. (docs/attachment-upload.md)

// 서버(hopes-server application.yml hopes.attachments) 기본값과 같게 맞춰요. 서버 값이 바뀌면 여기도 바꿔 주세요.
/** 한 메시지에 붙일 수 있는 첨부 개수 (max-count) */
export const MAX_ATTACHMENT_COUNT = 3
/** 파일당 최대 크기 5MB (max-file-bytes) */
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
/** 한 메시지 첨부 합계 12MB (max-total-bytes) */
export const MAX_ATTACHMENT_TOTAL_SIZE = 12 * 1024 * 1024
/** PDF 최대 쪽수 (max-pdf-pages) */
export const MAX_PDF_PAGES = 50

const ATTACHMENT_RULES: Record<string, { format: AttachmentFormat; mimeTypes: string[] }> = {
  jpg: { format: 'jpeg', mimeTypes: ['image/jpeg', 'image/pjpeg'] },
  jpeg: { format: 'jpeg', mimeTypes: ['image/jpeg', 'image/pjpeg'] },
  png: { format: 'png', mimeTypes: ['image/png'] },
  // HEIC는 서버가 받지 않아요 (PNG/JPEG/PDF만 지원)
  pdf: { format: 'pdf', mimeTypes: ['application/pdf'] },
}

export const ATTACHMENT_ACCEPT = [
  ...Object.keys(ATTACHMENT_RULES).map((extension) => `.${extension}`),
  ...new Set(Object.values(ATTACHMENT_RULES).flatMap(({ mimeTypes }) => mimeTypes)),
].join(',')

export type AttachmentCheck = { ok: true; format: AttachmentFormat } | { ok: false; reason: 'type' | 'size' }

/** 확장자·MIME 타입·크기 동기 검증 */
export function checkAttachmentFile(file: File): AttachmentCheck {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const rule = ATTACHMENT_RULES[extension]
  if (!rule) return { ok: false, reason: 'type' }
  // 브라우저가 형식을 모르면(예: Windows·Chrome의 HEIC) file.type이 빈 문자열이다.
  // 그때만 확장자를 믿고, 내용은 matchesFileSignature로 다시 확인한다.
  if (file.type && !rule.mimeTypes.includes(file.type)) return { ok: false, reason: 'type' }
  if (file.size > MAX_ATTACHMENT_SIZE) return { ok: false, reason: 'size' }
  return { ok: true, format: rule.format }
}

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']

/** 파일 앞부분 바이트(시그니처)가 형식과 맞는지 확인. 확장자만 바꾼 파일을 걸러낸다. */
export async function matchesFileSignature(file: File, format: AttachmentFormat) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte)
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))

  switch (format) {
    case 'pdf':
      return startsWith([0x25, 0x50, 0x44, 0x46]) // %PDF
    case 'png':
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'jpeg':
      return startsWith([0xff, 0xd8, 0xff])
    case 'heic':
      return ascii(4, 8) === 'ftyp' && HEIC_BRANDS.includes(ascii(8, 12))
  }
}

/** 브라우저가 이 이미지를 실제로 표시할 수 있는지 확인 (HEIC는 Safari 등 일부 브라우저만 지원) */
export async function canDisplayImage(url: string) {
  const image = new Image()
  image.src = url
  try {
    await image.decode()
    return true
  } catch {
    return false
  }
}
