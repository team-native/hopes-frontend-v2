export interface ChipOption<T extends string> {
  value: T
  label: string
  /** 오른쪽에 붙는 개수 (예: "작성글 2") */
  count?: number
}

interface ChipGroupProps<T extends string> {
  /** 화면 낭독기용 묶음 이름 (예: "게시판") */
  label: string
  options: readonly ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** 알약 모양 선택 칩 묶음 — 하나만 고를 수 있어요 (게시판 필터 · 활동 탭) */
function ChipGroup<T extends string>({ label, options, value, onChange, className = '' }: ChipGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`h-9 shrink-0 rounded-full border px-3.5 text-label transition duration-150 active:scale-95 ${
              selected
                ? 'border-border-brand bg-bg-brand-soft font-medium text-text-brand'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-brand'
            }`}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1 tabular-nums">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default ChipGroup
