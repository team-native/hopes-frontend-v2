export interface AnswerReaction {
  key: string
  label: string
  /** 강조(파란색)할 버튼 */
  primary?: boolean
  /** 눌린 상태 (예: 좋아요를 이미 누름) */
  pressed?: boolean
}

interface AnswerReactionsProps {
  reactions?: AnswerReaction[]
  onSelect: (key: string) => void
}

const DEFAULT_REACTIONS: AnswerReaction[] = [
  { key: 'like', label: '좋아요' },
  { key: 'more', label: '더 물어보기', primary: true },
  { key: 'share', label: '공유' },
]

/** 답변 아래 알약 버튼 줄 (Chat/Answer Reactions) */
function AnswerReactions({ reactions = DEFAULT_REACTIONS, onSelect }: AnswerReactionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="답변 반응">
      {reactions.map((reaction) => {
        const filled = reaction.primary || reaction.pressed
        return (
          <button
            key={reaction.key}
            type="button"
            onClick={() => onSelect(reaction.key)}
            aria-pressed={reaction.pressed}
            className={`h-8 rounded-full px-3.5 text-caption font-semibold transition ${
              filled
                ? 'bg-bg-brand text-text-on-brand shadow-cloud-brand hover:bg-bg-brand-pressed'
                : 'border border-border-default bg-bg-surface text-text-primary hover:bg-bg-canvas'
            }`}
          >
            {reaction.label}
          </button>
        )
      })}
    </div>
  )
}

export default AnswerReactions
