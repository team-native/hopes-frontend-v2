/**
 * 한글 옆 굵은 글씨(**…**) 살리기 — react-markdown(remark) 플러그인
 *
 * 마크다운 표준(CommonMark)은 `**` 바깥이 글자(한글)이고 안쪽이 문장부호(따옴표 · 괄호 등)이면
 * 굵은 글씨로 보지 않아요. 예: `프론트엔드는 **'사용자가 보는 화면'**을 만들고`
 * → 별표가 그대로 보여요. 한국어 · 중국어 · 일본어 글에서 자주 생기는 알려진 문제예요.
 *
 * 그래서 마크다운이 해석을 마친 뒤, 굵은 글씨가 되지 못하고 글자로 남은 `**…**`만 찾아 굵은 글씨로 바꿔요.
 * - 이미 굵은 글씨로 된 곳, 코드(`…`, ``` 블록) 안은 건드리지 않아요. (글자 노드만 봐요)
 * - 한 줄 안에서 짝이 맞는 `**`만 바꿔요.
 */

type MdNode = { type: string; value?: string; children?: MdNode[] }

/** 글자로 남은 **굵게** — 안쪽 양 끝은 공백이 아니어야 해요 (`** 띄어쓰기 **`는 그대로) */
const LEFTOVER_STRONG = /\*\*(?=\S)([^*\n]*?\S)\*\*/g

function splitText(value: string): MdNode[] | null {
  LEFTOVER_STRONG.lastIndex = 0
  if (!LEFTOVER_STRONG.test(value)) return null
  LEFTOVER_STRONG.lastIndex = 0

  const nodes: MdNode[] = []
  let last = 0
  for (const match of value.matchAll(LEFTOVER_STRONG)) {
    const start = match.index ?? 0
    if (start > last) nodes.push({ type: 'text', value: value.slice(last, start) })
    nodes.push({ type: 'strong', children: [{ type: 'text', value: match[1] }] })
    last = start + match[0].length
  }
  if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) })
  return nodes
}

function transform(node: MdNode) {
  if (!node.children) return
  const next: MdNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && child.value) {
      const replaced = splitText(child.value)
      if (replaced) {
        next.push(...replaced)
        continue
      }
    }
    transform(child)
    next.push(child)
  }
  node.children = next
}

/** react-markdown의 remarkPlugins에 넣어요: remarkPlugins={[remarkGfm, remarkCjkStrong]} */
function remarkCjkStrong() {
  return (tree: MdNode) => {
    transform(tree)
  }
}

export default remarkCjkStrong
