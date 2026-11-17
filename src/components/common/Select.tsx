import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import FieldError from './FieldError'

interface SelectProps {
  /** 위쪽 라벨 */
  label: string
  /** 아무것도 안 골랐을 때 글자 */
  placeholder: string
  options: readonly string[]
  /** 선택한 값 ('' = 선택 안 함) */
  value: string
  onChange: (value: string) => void
  /** 아래 에러 문구 (있으면 빨간 테두리) */
  errorMessage?: ReactNode
  /**
   * stacked: 라벨이 칸 위에 (회원가입 과·기수)
   * inline: 라벨이 칸 안 왼쪽, 값이 오른쪽 (Community/Board Select "게시판 · 10기")
   * compact: 값만 보이는 작은 알약 (커뮤니티 정렬 "최신순 ▾") — 라벨은 화면 낭독기에만 읽혀요
   */
  variant?: 'stacked' | 'inline' | 'compact'
  className?: string
}

/**
 * 드롭다운 선택 (시안 모양 그대로 직접 만든 목록)
 * 키보드: ↑↓ 이동, Enter/Space 선택, Esc 닫기
 */
function Select({
  label,
  placeholder,
  options,
  value,
  onChange,
  errorMessage,
  variant = 'stacked',
  className = '',
}: SelectProps) {
  const isInline = variant === 'inline'
  const isCompact = variant === 'compact'
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const labelId = `${baseId}-label`
  const listId = `${baseId}-list`
  const errorId = `${baseId}-error`
  const optionId = (index: number) => `${baseId}-option-${index}`

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const openList = () => {
    setActiveIndex(Math.max(0, options.indexOf(value)))
    setOpen(true)
  }

  const choose = (index: number) => {
    onChange(options[index])
    setOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeIndex >= 0) choose(activeIndex)
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
    }
  }

  const borderClass = errorMessage
    ? 'border-border-danger'
    : open
      ? 'border-border-brand'
      : 'border-border-default focus-visible:border-border-brand'

  return (
    <div className={className}>
      {isCompact && (
        <span id={labelId} className="sr-only">
          {label}
        </span>
      )}
      {!isInline && !isCompact && (
        <p id={labelId} className="mb-2 text-label font-medium text-text-secondary">
          {label}
        </p>
      )}

      <div ref={rootRef} className="relative">
        <button
          type="button"
          role="combobox"
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? errorId : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={handleKeyDown}
          className={`flex items-center justify-between gap-2 border bg-bg-surface text-left transition outline-none ${
            isCompact
              ? 'h-9 gap-1 rounded-full px-3.5 text-caption'
              : `w-full rounded-sm px-4 ${isInline ? 'h-11 text-caption' : 'h-[52px] text-body'}`
          } ${borderClass}`}
        >
          {isInline && (
            <span id={labelId} className="mr-auto shrink-0 text-text-secondary">
              {label}
            </span>
          )}
          <span
            className={`truncate ${value ? (isInline ? 'font-medium text-text-primary' : '') : 'text-text-tertiary'}`}
          >
            {value || placeholder}
          </span>
          <svg
            viewBox="0 0 16 16"
            className={`size-4 shrink-0 text-icon-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            aria-hidden
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className={`absolute top-full z-20 mt-1.5 rounded-md border border-border-default bg-bg-surface p-1.5 shadow-cloud-md ${
              isCompact ? 'right-0 min-w-32' : 'inset-x-0'
            }`}
          >
            {options.map((option, index) => {
              const selected = option === value
              const active = index === activeIndex
              return (
                <li
                  key={option}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActiveIndex(index)}
                  // 버튼 포커스를 유지하려고 mousedown 기본 동작은 막음
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(index)}
                  className={`flex h-11 cursor-pointer items-center justify-between rounded-sm px-3 text-label ${
                    selected ? 'bg-bg-brand-soft font-medium text-text-brand' : active ? 'bg-bg-canvas' : ''
                  }`}
                >
                  {option}
                  {selected && (
                    <svg viewBox="0 0 12 12" className="size-3.5" fill="none" aria-hidden>
                      <path
                        d="M2.5 6.2 5 8.5l4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {errorMessage && <FieldError id={errorId}>{errorMessage}</FieldError>}
    </div>
  )
}

export default Select
