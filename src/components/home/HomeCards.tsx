import useLikePop from '../../hooks/useLikePop'
import { LikeHeart } from '../community/ReactionChips'
import type { CSSProperties, ReactNode } from 'react'
import heroCloud from '../../assets/home/hero-cloud.png'
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
      <HeroCloud />
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

/** 히어로 카드 오른쪽 아래 구름 (피그마 이미지, 2배 해상도 520×280 → 260×140) */
function HeroCloud() {
  return (
    <img
      src={heroCloud}
      alt=""
      width={260}
      height={140}
      className="pointer-events-none absolute right-0 bottom-0 h-[140px] w-[260px] select-none"
      aria-hidden
    />
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
  /** 등장 모션 지연 등 (예: stagger(1)) */
  style?: CSSProperties
}

/** 홈 묶음 카드 — 제목 · 더보기 + 줄 목록 (이어서 하기, 커뮤니티 인기글, 질문 잘하는 방법) */
export function HomePanel({
  title,
  actionText,
  onAction,
  divided = true,
  children,
  className = '',
  style,
}: HomePanelProps) {
  return (
    <section
      className={`rounded-lg border border-border-subtle bg-bg-surface px-md pt-md pb-xs shadow-cloud-sm ${className}`}
      style={style}
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
  /** 줄 맨 오른쪽, 줄 버튼 바깥에 두는 요소 (예: 좋아요 버튼) */
  trailing?: ReactNode
}

/** HomePanel 안의 한 줄 — 제목 + 오른쪽 작은 글자 */
export function HomePanelRow({ title, meta, leading, size = 'md', onClick, trailing }: HomePanelRowProps) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left transition hover:text-text-brand ${
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
      {trailing}
    </li>
  )
}

interface PopularPostRowProps {
  board: string
  title: string
  likeCount: number
  /** 내가 좋아요를 눌렀는지 */
  liked?: boolean
  onClick?: () => void
  /** 넘기면 하트를 눌러 홈에서 바로 좋아요할 수 있어요 */
  onToggleLike?: () => void
}

/** 인기 글 한 줄 (Home/Popular Post Row) — HomePanel 안에 넣어요 */
export function PopularPostRow({ board, title, likeCount, liked = false, onClick, onToggleLike }: PopularPostRowProps) {
  const [popKey, pop] = useLikePop()
  const likeLabel = `좋아요 ${likeCount}개${liked ? ', 누름' : ''}`

  return (
    <HomePanelRow
      title={title}
      onClick={onClick}
      meta={<span aria-label={`${board} 게시판`}>{board}</span>}
      trailing={
        onToggleLike ? (
          <button
            type="button"
            onClick={() => {
              if (!liked) pop()
              onToggleLike()
            }}
            aria-pressed={liked}
            aria-label={`${title} ${likeLabel}`}
            className={`-mr-1.5 flex h-7 shrink-0 items-center gap-1 rounded-full px-1.5 text-caption transition duration-150 hover:bg-bg-brand-soft hover:text-text-brand active:scale-90 ${
              liked ? 'text-text-brand' : 'text-text-tertiary'
            }`}
          >
            <LikeHeart liked={liked} popKey={popKey} className="size-3" />
            <span className="tabular-nums">{likeCount}</span>
          </button>
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-caption text-text-tertiary" aria-label={likeLabel}>
            <LikeHeart liked={liked} popKey={0} className="size-3" />
            {likeCount}
          </span>
        )
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
