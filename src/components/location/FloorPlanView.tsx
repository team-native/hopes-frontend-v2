import { useEffect, useState, type MouseEvent } from 'react'
import { getFloorPlanImage } from '../../api/campus'
import type { FloorPlanInfo, LocationPlace } from '../../api/chats'

type Point = { x: number; y: number }

interface FloorPlanViewProps {
  floorPlan: FloorPlanInfo
  /** 목적지 방 전체를 칠할 사각형 */
  area?: LocationPlace['area']
  /** 목적지 표시 점 (문 또는 복도 접점) */
  destination?: Point | null
  /** 출발 표시 점 */
  start?: Point | null
  /** 이 층에서 지나가는 길 (도면 좌표) */
  path?: Point[]
  /** 넘기면 도면을 눌러 위치를 고를 수 있어요 (도면 좌표로 돌려줘요) */
  onPick?: (point: Point) => void
  /** 화면 낭독기용 설명 */
  label: string
}

/** 도면 이미지 주소 캐시 — 같은 도면을 여러 카드에서 써도 한 번만 받아요 */
const imageCache = new Map<string, Promise<string>>()

function loadImage(floorPlanId: string) {
  let pending = imageCache.get(floorPlanId)
  if (!pending) {
    pending = getFloorPlanImage(floorPlanId).then((blob) => URL.createObjectURL(blob))
    // 실패하면 캐시에서 빼서 "다시 시도"할 때 새로 받아요
    pending.catch(() => imageCache.delete(floorPlanId))
    imageCache.set(floorPlanId, pending)
  }
  return pending
}

/**
 * 도면 한 장 + 그 위 표시 (목적지 방 · 길 · 출발 · 도착)
 * - 이미지는 로그인 토큰이 필요해서 axios로 받아 blob 주소로 보여 줘요.
 * - 상자 비율을 도면 width:height와 똑같이 두고, SVG viewBox도 같은 크기로 겹쳐서
 *   서버 좌표(도면 픽셀)를 변환 없이 그대로 써요. (여백이 생기지 않아 좌표가 어긋나지 않아요)
 */
function FloorPlanView({ floorPlan, area, destination, start, path, onPick, label }: FloorPlanViewProps) {
  const { id, width, height } = floorPlan
  const [image, setImage] = useState<{ id: string; url?: string; failed?: boolean }>({ id })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    loadImage(id)
      .then((url) => active && setImage({ id, url }))
      .catch(() => active && setImage({ id, failed: true }))
    return () => {
      active = false
    }
  }, [id, retry])

  // 표시 크기는 도면 크기에 비례해서 정해요 (도면이 작아도 점 · 선이 보이게)
  const unit = Math.max(width, height) / 120
  const current = image.id === id ? image : { id }

  function pick(event: MouseEvent<SVGSVGElement>) {
    if (!onPick) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * width
    const y = ((event.clientY - box.top) / box.height) * height
    onPick({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-border-subtle bg-bg-surface"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {current.url ? (
        <img src={current.url} alt={label} className="absolute inset-0 size-full select-none" draggable={false} />
      ) : current.failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-bg-canvas text-caption text-text-secondary">
          도면을 불러오지 못했어요.
          <button
            type="button"
            onClick={() => setRetry((count) => count + 1)}
            className="font-medium text-text-brand hover:underline"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-bg-canvas" role="status" aria-label="도면을 불러오는 중" />
      )}

      {current.url && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          // 이미지처럼 상자를 꽉 채워요. (기본값은 비율을 지키며 가운데 정렬이라, 테두리 · 반올림으로
          // 상자 비율이 조금만 달라도 이미지와 표시가 몇 px 어긋나요)
          preserveAspectRatio="none"
          className={`absolute inset-0 size-full ${onPick ? 'cursor-crosshair' : 'pointer-events-none'}`}
          onClick={pick}
          aria-hidden
        >
          {area && (
            <rect
              x={area.x}
              y={area.y}
              width={area.width}
              height={area.height}
              rx={unit * 0.4}
              className="fill-bg-brand/20 stroke-bg-brand"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {path && path.length > 1 && (
            <polyline
              points={path.map(({ x, y }) => `${x},${y}`).join(' ')}
              fill="none"
              className="stroke-bg-brand"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {start && (
            <circle
              cx={start.x}
              cy={start.y}
              r={unit}
              className="fill-bg-surface stroke-bg-brand"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {destination && (
            <circle
              cx={destination.x}
              cy={destination.y}
              r={unit}
              className="fill-bg-brand stroke-bg-surface"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}
    </div>
  )
}

export default FloorPlanView
