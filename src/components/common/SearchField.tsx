import { Search, X } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  /** Enter 눌렀을 때 */
  onSearch?: (value: string) => void
}

/** 돋보기 + 입력 + 지우기(X) 검색창 (Form/Search Field) */
function SearchField({ value, onChange, onSearch, placeholder = '검색', className = '', ...rest }: SearchFieldProps) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-full border border-border-subtle bg-bg-surface pr-2 pl-4 shadow-cloud-sm transition focus-within:border-border-brand ${className}`}
    >
      <Search className="size-[18px] shrink-0 text-icon-muted" strokeWidth={1.75} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // 한글 조합 중 Enter는 무시 (조합이 끝나기 전 값으로 검색되거나 두 번 검색되는 것 방지)
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) onSearch?.(value)
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        {...rest}
        className="min-w-0 flex-1 bg-transparent text-label outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-icon-muted transition hover:bg-bg-canvas hover:text-icon-default"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
  )
}

export default SearchField
