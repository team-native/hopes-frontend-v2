import type { LocationPlace } from '../../api/chats'

type Area = NonNullable<LocationPlace['area']>

/** 같은 방 색으로 볼 허용 차이 (RGB 채널마다) */
const COLOR_TOLERANCE = 28
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
 * 나뉘어 있으니, 사각형 안에서 가장 많은 방 색을 찾고 그 색으로 이어진 곳만 칠해요 (그림판 "페인트 통").
 *
 * 1. 사각형 안 픽셀 중 흰색 · 글씨(어두운 색) · 건물 벽(연한 파랑)을 빼고 가장 많은 색 = 방 색
 * 2. 방 색으로 이어진 덩어리들 중 사각형 안에 가장 많이 들어온 덩어리 고르기
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

  // 1) 방 색: 서버 사각형 안에서 가장 많은 색 (흰 선 · 글씨 제외)
  const inRect = (x: number, y: number) =>
    x + left >= area.x && x + left < area.x + area.width && y + top >= area.y && y + top < area.y + area.height
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  for (let y = 0; y < boxHeight; y++) {
    for (let x = 0; x < boxWidth; x++) {
      if (!inRect(x, y)) continue
      const [r, g, b] = rgb(y * boxWidth + x)
      const isWhite = r > 235 && g > 235 && b > 235
      const isText = r * 0.299 + g * 0.587 + b * 0.114 < 120
      // 건물 바깥 벽(연한 파랑, 예: 180 200 232)은 방이 아니에요. 사각형이 벽에 걸쳐 있으면 벽을 고를 수 있어서 빼요
      const isWall = b > r + 30 && b > g + 15
      if (isWhite || isText || isWall) continue
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
      bucket.count++
      bucket.r += r
      bucket.g += g
      bucket.b += b
      buckets.set(key, bucket)
    }
  }
  const top1 = [...buckets.values()].sort((a, b) => b.count - a.count)[0]
  if (!top1) return null
  const target = [top1.r / top1.count, top1.g / top1.count, top1.b / top1.count]
  const matches = (index: number) => {
    const [r, g, b] = rgb(index)
    return (
      Math.abs(r - target[0]) <= COLOR_TOLERANCE &&
      Math.abs(g - target[1]) <= COLOR_TOLERANCE &&
      Math.abs(b - target[2]) <= COLOR_TOLERANCE
    )
  }

  // 2) 같은 방 색으로 이어진 덩어리들 중, 사각형 안에서 가장 큰 덩어리 = 목적지 방
  //    (가운데 한 점에서 시작하면 방 이름 글씨 가장자리의 작은 조각에서 멈출 수 있어요)
  const label = new Int32Array(boxWidth * boxHeight) // 0 = 아직 안 봄, 1부터 덩어리 번호
  let bestLabel = 0
  let bestInside = 0
  let nextLabel = 1
  for (let start = 0; start < label.length; start++) {
    if (label[start] || !matches(start)) continue
    const current = nextLabel++
    let inside = 0
    const stack = [start]
    label[start] = current
    while (stack.length) {
      const index = stack.pop()!
      const x = index % boxWidth
      if (inRect(x, (index - x) / boxWidth)) inside++
      // 위아래는 범위 검사(next < 0 · next >= 길이)로, 좌우는 줄 끝을 넘지 않게 x로 막아요
      for (const next of [
        x > 0 ? index - 1 : -1,
        x < boxWidth - 1 ? index + 1 : -1,
        index - boxWidth,
        index + boxWidth,
      ]) {
        if (next < 0 || next >= label.length || label[next] || !matches(next)) continue
        label[next] = current
        stack.push(next)
      }
    }
    if (inside > bestInside) {
      bestInside = inside
      bestLabel = current
    }
  }
  if (!bestLabel) return null

  const MASK = 1
  const OUTSIDE = 2
  const state = new Uint8Array(boxWidth * boxHeight)
  for (let i = 0; i < state.length; i++) if (label[i] === bestLabel) state[i] = MASK

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
  const rectArea = area.width * area.height
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
