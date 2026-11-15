import { Check, Copy } from 'lucide-react'
import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnswerBubbleProps {
  /** 선배 답변 (마크다운 글) */
  content: string
  /** 답변 아래에 붙일 것 (예: <AnswerReactions />) */
  footer?: ReactNode
}

/** 코드 블록: 언어 이름 + 복사 버튼 */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 복사가 막힌 환경(권한 없음 등)에서는 조용히 무시
    }
  }

  return (
    <div className="my-3 rounded-sm bg-bg-canvas px-3.5 pt-2.5 pb-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-tertiary">{language || 'code'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? '복사됨' : '코드 복사'}
          className="flex size-6 items-center justify-center rounded-[6px] text-icon-muted transition hover:bg-bg-surface hover:text-icon-default"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        </button>
      </div>
      <pre className="mt-1 overflow-x-auto text-[12px] leading-[18px] text-text-primary">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** 마크다운 요소별 시안 스타일 */
const markdownComponents: Components = {
  h1: (props) => <h3 className="mb-2 text-heading" {...props} />,
  h2: (props) => <h3 className="mb-2 text-heading" {...props} />,
  h3: (props) => <h3 className="mb-2 text-body-strong" {...props} />,
  p: (props) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:font-medium marker:text-text-brand" {...props} />,
  ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-text-brand" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-3 border-l-2 border-border-brand pl-3 text-text-secondary [&>p]:my-0" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a className="text-text-brand underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  // 코드 블록(```)은 pre로 감싸져 와요 → CodeBlock으로 바꿔 그림
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) => {
    const match = /language-(\w+)/.exec(className ?? '')
    const text = String(children ?? '')
    const isBlock = Boolean(match) || text.includes('\n')
    if (isBlock) return <CodeBlock language={match?.[1] ?? ''} code={text.replace(/\n$/, '')} />
    return (
      <code className="rounded-[4px] bg-bg-canvas px-1 py-0.5 text-[0.9em]" {...props}>
        {children}
      </code>
    )
  },
}

/** 선배(AI) 답변 말풍선 (Chat/Bubble Answer) — 마크다운을 시안 모양으로 그려 줘요 */
function AnswerBubble({ content, footer }: AnswerBubbleProps) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <div className="w-full max-w-[600px] rounded-lg border border-border-subtle bg-bg-surface px-5 py-4 text-label text-text-primary shadow-cloud-sm">
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </Markdown>
      </div>
      {footer}
    </div>
  )
}

export default AnswerBubble
