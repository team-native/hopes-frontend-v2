import { ChevronRight, CircleCheck } from 'lucide-react'

interface RelatedQuestionsProps {
  title?: string
  questions: string[]
  onSelect: (question: string) => void
}

/** 답변 아래 "추가로 많이 묻는 질문" 카드 (Chat/Related Questions) */
function RelatedQuestions({ title = '추가로 많이 묻는 질문', questions, onSelect }: RelatedQuestionsProps) {
  return (
    <section className="w-full max-w-[360px] rounded-lg border border-border-subtle bg-bg-surface px-4 pt-3.5 pb-1.5 shadow-cloud-sm">
      <h3 className="text-label-strong">{title}</h3>
      <ul className="mt-1 divide-y divide-border-subtle">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              className="group flex w-full items-center gap-2 py-2.5 text-left text-caption text-text-primary"
            >
              <CircleCheck className="size-4 shrink-0 fill-icon-brand text-bg-surface" strokeWidth={2} aria-hidden />
              <span className="flex-1 group-hover:text-text-brand">{question}</span>
              <ChevronRight className="size-4 shrink-0 text-icon-default" strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RelatedQuestions
