import { Heart } from 'lucide-react'
import type { ReactNode } from 'react'
import Button from '../common/Button'

interface HeroCardProps {
  title: ReactNode
  description: string
  actionText: string
  onAction: () => void
}

/** 홈 맨 위 큰 안내 카드 (Web/Hero Card) — 감싸는 영역 폭을 꽉 채워요 */
export function HeroCard({ title, description, actionText, onAction }: HeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-border-subtle bg-gradient-to-r from-bg-surface from-40% to-blue-50 p-xl shadow-cloud-sm">
      {/* 오른쪽 아래 구름 장식 */}
      <div
        className="pointer-events-none absolute -right-6 -bottom-16 size-48 rounded-full bg-bg-brand-soft/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-28 -bottom-20 size-40 rounded-full bg-bg-brand-soft/60"
        aria-hidden
      />
      <div className="relative">
        <h2 className="text-title font-bold whitespace-pre-line">{title}</h2>
        <p className="mt-xs text-label text-text-secondary">{description}</p>
        <Button size="sm" className="mt-md h-11 px-lg" onClick={onAction}>
          {actionText}
        </Button>
      </div>
    </section>
  )
}

interface HomePanelProps {
  /** 카드 왼쪽 위 작은 제목 (예: "이어서 하기") */
  title: string
  /** 오른쪽 위 링크 글자 (예: "더보기") — onAction과 함께 넘겨요 */
  actionText?: string
  onAction?: () => void
  /** 줄 사이 구분선 (기본 true) — 팁처럼 구분선이 없는 목록은 false */
  divided?: boolean
  children: ReactNode
  className?: string
}

/** 홈 묶음 카드 — 제목 · 더보기 + 줄 목록 (이어서 하기, 커뮤니티 인기글, 질문 잘하는 방법) */
export function HomePanel({ title, actionText, onAction, divided = true, children, className = '' }: HomePanelProps) {
  return (
    <section
      className={`rounded-lg border border-border-subtle bg-bg-surface px-md pt-md pb-xs shadow-cloud-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-caption text-text-secondary">{title}</h2>
        {actionText && onAction && (
          <button type="button" onClick={onAction} className="text-caption font-medium text-text-brand hover:underline">
            {actionText}
          </button>
        )}
      </div>
      <ul className={`mt-1 ${divided ? 'divide-y divide-border-subtle' : 'space-y-sm py-xs'}`}>{children}</ul>
    </section>
  )
}

interface HomePanelRowProps {
  title: string
  /** 오른쪽 작은 글자 (예: "어제", "전체 · ♡ 34") */
  meta?: ReactNode
  /** 제목 앞 파란 글자 (예: 순위 "1") */
  leading?: ReactNode
  /** md: 홈 카드(56) / sm: 옆 칸 목록(44) */
  size?: 'md' | 'sm'
  onClick?: () => void
}

/** HomePanel 안의 한 줄 — 제목 + 오른쪽 작은 글자 */
export function HomePanelRow({ title, meta, leading, size = 'md', onClick }: HomePanelRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 text-left transition hover:text-text-brand ${
          size === 'sm' ? 'min-h-11' : 'min-h-14'
        }`}
      >
        {leading !== undefined && (
          <span className="w-3 shrink-0 text-caption font-medium text-text-brand">{leading}</span>
        )}
        <span className={`min-w-0 flex-1 truncate ${size === 'sm' ? 'text-label font-medium' : 'text-label'}`}>
          {title}
        </span>
        {meta && <span className="shrink-0 text-caption text-text-tertiary">{meta}</span>}
      </button>
    </li>
  )
}

interface PopularPostRowProps {
  board: string
  title: string
  likeCount: number
  onClick?: () => void
}

/** 인기 글 한 줄 (Home/Popular Post Row) — HomePanel 안에 넣어요 */
export function PopularPostRow({ board, title, likeCount, onClick }: PopularPostRowProps) {
  return (
    <HomePanelRow
      title={title}
      onClick={onClick}
      meta={
        <span className="flex items-center gap-1" aria-label={`${board} 게시판, 좋아요 ${likeCount}개`}>
          {board} ·
          <Heart className="size-3" strokeWidth={1.75} aria-hidden />
          {likeCount}
        </span>
      }
    />
  )
}

interface TipCardProps {
  /** 동그라미 안 숫자 */
  step: number
  /** 위쪽 작은 글자 (예: "질문 전에,") */
  caption: string
  text: string
}

/** 번호가 붙은 팁 한 줄 (Home/Tip Card) — HomePanel(divided={false}) 안에 넣어요 */
export function TipCard({ step, caption, text }: TipCardProps) {
  return (
    <li className="flex items-center gap-3 py-1">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-brand-soft text-caption font-semibold text-text-brand">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-caption text-text-tertiary">{caption}</p>
        <p className="text-label-strong">{text}</p>
      </div>
    </li>
  )
}
