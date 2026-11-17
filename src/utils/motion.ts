import type { CSSProperties } from 'react'

/**
 * 목록이 차례로 나타나게 하는 지연 시간 (animate-fade-up과 함께 써요)
 * 예: <li className="animate-fade-up" style={stagger(index)}>
 * 긴 목록에서 마지막 줄이 너무 늦게 나오지 않게 8번째부터는 같은 지연을 써요.
 */
export function stagger(index: number, step = 40): CSSProperties {
  return { animationDelay: `${Math.min(index, 8) * step}ms` }
}
