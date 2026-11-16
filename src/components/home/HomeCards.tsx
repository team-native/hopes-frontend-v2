import { Heart } from 'lucide-react'
import type { ReactNode } from 'react'
import Badge from '../common/Badge'
import Button from '../common/Button'

interface HeroCardProps {
  title: ReactNode
  description: string
  actionText: string
  onAction: () => void
}

/** 홈 맨 위 큰 안내 카드 (Home/Hero Card) */
export function HeroCard({ title, description, actionText, onAction }: HeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-bg-canvas-deep p-xl">
      <div
        className="pointer-events-none absolute -right-8 -bottom-14 size-36 rounded-full bg-bg-brand-soft"
        aria-hidden
      />
      <div className="relative">
        <h2 className="text-heading font-bold whitespace-pre-line">{title}</h2>
        <p className="mt-xs text-caption text-text-secondary">{description}</p>
        <Button size="sm" variant="soft" className="mt-sm bg-bg-surface/70!" onClick={onAction}>
          {actionText}
        </Button>
      </div>
    </section>
  )
}

interface TipCardProps {
  /** 동그라미 안 숫자 */
  step: number
  /** 위쪽 작은 글자 (예: "질문 전에,") */
  caption: string
  text: string
}

/** 번호가 붙은 팁 한 줄 카드 (Home/Tip Card) */
export function TipCard({ step, caption, text }: TipCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-surface px-md py-3 shadow-cloud-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-brand-soft text-caption font-semibold text-text-brand">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-text-tertiary">{caption}</p>
        <p className="truncate text-label font-medium">{text}</p>
      </div>
    </div>
  )
}

interface PopularPostRowProps {
  board: string
  title: string
  likeCount: number
  onClick?: () => void
}

/** 인기 글 한 줄 (Home/Popular Post Row) */
export function PopularPostRow({ board, title, likeCount, onClick }: PopularPostRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md border border-border-subtle bg-bg-surface px-md py-3 text-left shadow-cloud-sm transition hover:border-border-brand"
    >
      <Badge>{board}</Badge>
      <span className="min-w-0 flex-1 truncate text-caption font-medium">{title}</span>
      <span
        className="flex shrink-0 items-center gap-0.5 text-[11px] text-text-tertiary"
        aria-label={`좋아요 ${likeCount}개`}
      >
        <Heart className="size-3" strokeWidth={1.75} aria-hidden />
        {likeCount}
      </span>
    </button>
  )
}
