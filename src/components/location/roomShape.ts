import type { LocationPlace } from '../../api/chats'

type Area = NonNullable<LocationPlace['area']>

/**
 * 같은 색으로 볼 허용 차이 (RGB 채널마다)
 * 도면은 색을 평평하게 칠한 PNG라 작게 둬요. 본관은 방(187 200 232)과 벽(179 199 232)이 거의 같은 파랑이라
 * 크게 두면 방과 벽이 한 덩어리가 돼요.
 */
const COLOR_TOLERANCE = 6
/** 방 색 후보로 볼 색 개수 (사각형 안에서 많은 순) */
const CANDIDATE_COLORS = 3
/**
 * 서버 사각형이 실제 방과 조금 어긋날 수 있어서 바깥으로 이만큼 더 찾아봐요 (도면 픽셀)
 * (예: 금봉관 3F AI모델링실은 사각형이 실제 방보다 약 23px 아래에 있어요)
 * 방끼리는 흰 선으로 나뉘어 있어서 여유를 넓혀도 옆 방으로 번지지 않아요.
 */
const SEARCH_MARGIN = 24

/**
 * 도면 이미지에서 목적지 방의 실제 모양을 찾아 강조 이미지(data URL)로 만들어요.
 *
 * 서버는 방을 직사각형(area)으로만 줘요. 그런데 도면의 방은 ㄱ자처럼 생겼거나 사각형 안에 복도가
 * 섞여 있어서, 사각형 테두리만 그리면 실제 방과 어긋나요. 도면은 방마다 색이 칠해져 있고 흰 선으로
 * 나뉘어 있으니, 같은 색으로 이어진 덩어리를 찾아 그 모양대로 칠해요 (그림판 "페인트 통").
 *
 * 1. 사각형 안에서 많은 색 몇 개를 후보로 골라요 (흰 선 · 글씨 제외)
 * 2. 후보 색마다 같은 색으로 이어진 덩어리를 만들고, 그중 방다운 덩어리를 골라요
 *    - 벽 · 복도는 건물을 따라 길게 이어져서 찾는 범위 가장자리에 닿아요. 방은 범위 안에 들어와 있어요.
 *    - 그래서 가장자리에 닿지 않는 덩어리를 먼저, 그다음 사각형 안에 많이 들어온 덩어리를 골라요.
 *    - 색으로 벽을 빼지 않는 이유: 본관은 방과 벽 색이 거의 같아서 방까지 빠져요.
 * 3. 영역 안에 갇힌 구멍(방 이름 글씨 등)도 방으로 채우기
 * 4. 결과가 사각형과 너무 다르면(너무 작거나 큼) 실패로 보고 null → 화면은 사각형으로 표시
 */
export function computeRoomShape(image: CanvasImageSource, width: number, height: number, area: Area, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)

  // 찾을 범위 = 서버 사각형 + 여유
  const left = Math.max(0, Math.floor(area.x - SEARCH_MARGIN))
  const top = Math.max(0, Math.floor(area.y - SEARCH_MARGIN))
  const right = Math.min(width, Math.ceil(area.x + area.width + SEARCH_MARGIN))
  const bottom = Math.min(height, Math.ceil(area.y + area.height + SEARCH_MARGIN))
  const boxWidth = right - left
  const boxHeight = bottom - top
  if (boxWidth <= 0 || boxHeight <= 0) return null
  const pixels = context.getImageData(left, top, boxWidth, boxHeight).data
  const rgb = (index: number) => [pixels[index * 4], pixels[index * 4 + 1], pixels[index * 4 + 2]] as const

  // 1) 후보 색: 서버 사각형 안에서 많은 색 (흰 선 · 글씨 제외, 정확한 색 기준)
  const inRect = (x: number, y: number) =>
    x + left >= area.x && x + left < area.x + area.width && y + top >= area.y && y + top < area.y + area.height
  const counts = new Map<number, number>()
  for (let y = 0; y < boxHeight; y++) {
    for (let x = 0; x < boxWidth; x++) {
      if (!inRect(x, y)) continue
      const [r, g, b] = rgb(y * boxWidth + x)
      const isWhite = r > 235 && g > 235 && b > 235
      const isText = r * 0.299 + g * 0.587 + b * 0.114 < 120
      if (isWhite || isText) continue
      const key = (r << 16) | (g << 8) | b
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  // 거의 같은 색(허용 차이 안)은 한 후보로 묶어요
  const candidates: number[][] = []
  for (const [key] of [...counts].sort((a, b) => b[1] - a[1])) {
    const color = [key >> 16, (key >> 8) & 255, key & 255]
    if (candidates.some((c) => c.every((v, i) => Math.abs(v - color[i]) <= COLOR_TOLERANCE))) continue
    candidates.push(color)
    if (candidates.length >= CANDIDATE_COLORS) break
  }
  if (!candidates.length) return null

  // 2) 후보 색마다 같은 색으로 이어진 덩어리를 만들고 방다운 덩어리를 골라요
  const rectArea = area.width * area.height
  let best: { pixels: number[]; inside: number; touchesEdge: boolean } | null = null
  const isBetter = (a: NonNullable<typeof best>, b: typeof best) =>
    !b || (a.touchesEdge !== b.touchesEdge ? !a.touchesEdge : a.inside > b.inside)
  for (const target of candidates) {
    const matches = (index: number) => {
      const [r, g, b] = rgb(index)
      return (
        Math.abs(r - target[0]) <= COLOR_TOLERANCE &&
        Math.abs(g - target[1]) <= COLOR_TOLERANCE &&
        Math.abs(b - target[2]) <= COLOR_TOLERANCE
      )
    }
    const seen = new Uint8Array(boxWidth * boxHeight)
    for (let start = 0; start < seen.length; start++) {
      if (seen[start] || !matches(start)) continue
      const component = { pixels: [] as number[], inside: 0, touchesEdge: false }
      const stack = [start]
      seen[start] = 1
      while (stack.length) {
        const index = stack.pop()!
        const x = index % boxWidth
        const y = (index - x) / boxWidth
        component.pixels.push(index)
        if (inRect(x, y)) component.inside++
        // 찾는 범위 가장자리에 닿으면 범위 밖으로 계속 이어지는 복도 · 벽이에요.
        // 단, 범위가 이미지 경계에서 잘린 쪽은 더 이어질 곳이 없으니 세지 않아요 (예: 맨 위까지 닿은 도서실)
        if (
          (x === 0 && left > 0) ||
          (y === 0 && top > 0) ||
          (x === boxWidth - 1 && right < width) ||
          (y === boxHeight - 1 && bottom < height)
        ) {
          component.touchesEdge = true
        }
        // 위아래는 범위 검사(next < 0 · next >= 길이)로, 좌우는 줄 끝을 넘지 않게 x로 막아요
        for (const next of [
          x > 0 ? index - 1 : -1,
          x < boxWidth - 1 ? index + 1 : -1,
          index - boxWidth,
          index + boxWidth,
        ]) {
          if (next < 0 || next >= seen.length || seen[next] || !matches(next)) continue
          seen[next] = 1
          stack.push(next)
        }
      }
      // 사각형에 거의 안 걸친 조각은 빼요. 다만 서버 사각형이 방보다 밀려 있으면(예: 금봉관 2F 탈의실 ·
      // 샤워실은 사각형 대부분이 복도 · 방 이름 글씨) 진짜 방도 조금만 걸쳐서 기준을 낮게 둬요.
      // 너무 작은 조각은 아래 4)의 크기 확인에서 걸러져요.
      if (component.inside < rectArea * 0.05) continue
      if (isBetter(component, best)) best = component
    }
  }
  // 가장자리에 닿는 덩어리는 복도 · 벽이에요. 그런 것밖에 없으면 방을 못 찾은 것 → 사각형
  if (!best || best.touchesEdge) return null

  const MASK = 1
  const OUTSIDE = 2
  const state = new Uint8Array(boxWidth * boxHeight)
  for (const index of best.pixels) state[index] = MASK

  // 3) 구멍 채우기: 테두리에서 시작해 방이 아닌 곳을 "바깥"으로 표시하고, 남은 곳은 방 안 구멍
  const outsideQueue: number[] = []
  const markOutside = (index: number) => {
    if (state[index]) return
    state[index] = OUTSIDE
    outsideQueue.push(index)
  }
  for (let x = 0; x < boxWidth; x++) {
    markOutside(x)
    markOutside((boxHeight - 1) * boxWidth + x)
  }
  for (let y = 0; y < boxHeight; y++) {
    markOutside(y * boxWidth)
    markOutside(y * boxWidth + boxWidth - 1)
  }
  while (outsideQueue.length) {
    const index = outsideQueue.pop()!
    const x = index % boxWidth
    if (x > 0) markOutside(index - 1)
    if (x < boxWidth - 1) markOutside(index + 1)
    if (index - boxWidth >= 0) markOutside(index - boxWidth)
    if (index + boxWidth < state.length) markOutside(index + boxWidth)
  }
  let count = 0
  for (let i = 0; i < state.length; i++) {
    if (state[i] !== OUTSIDE) {
      state[i] = MASK
      count++
    }
  }

  // 4) 결과 확인: 사각형 넓이와 너무 다르면 잘못 찾은 것
  if (count < rectArea * 0.25 || count > rectArea * 2.5) return null

  // 강조 이미지: 방 안은 옅게, 가장자리는 진하게
  context.fillStyle = color
  const [brandR, brandG, brandB] = parseColor(context.fillStyle)
  const outline = Math.max(1, Math.round(Math.max(width, height) / 400))
  const output = context.createImageData(boxWidth, boxHeight)
  const isMask = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < boxWidth && y < boxHeight && state[y * boxWidth + x] === MASK
  for (let y = 0; y < boxHeight; y++) {
    for (let x = 0; x < boxWidth; x++) {
      if (!isMask(x, y)) continue
      let edge = false
      for (let dy = -outline; dy <= outline && !edge; dy++) {
        for (let dx = -outline; dx <= outline && !edge; dx++) {
          if (!isMask(x + dx, y + dy)) edge = true
        }
      }
      const offset = (y * boxWidth + x) * 4
      output.data[offset] = brandR
      output.data[offset + 1] = brandG
      output.data[offset + 2] = brandB
      output.data[offset + 3] = edge ? 255 : 56
    }
  }
  context.clearRect(0, 0, width, height)
  context.putImageData(output, left, top)
  return canvas.toDataURL('image/png')
}

/** canvas가 정리해 준 색 문자열("#rrggbb" 또는 "rgba(…)")을 RGB 숫자로 */
function parseColor(value: string) {
  if (value.startsWith('#')) {
    return [1, 3, 5].map((start) => Number.parseInt(value.slice(start, start + 2), 16))
  }
  const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
  return numbers.slice(0, 3)
}
