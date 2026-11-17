import type { MouseEvent } from 'react'
import type { FloorPlanInfo, LocationPlace } from '../../api/chats'

export type Point = { x: number; y: number }

/** 도면 위에 그릴 표시들 (모두 도면 좌표) */
export interface FloorPlanMarks {
  /** 목적지 방 (서버 사각형 — 실제 방 모양은 도면 이미지에서 찾아요) */
  area?: LocationPlace['area']
  /** 목적지 표시 점 (문 또는 복도 접점) */
  destination?: Point | null
  /** 출발 표시 점 */
  start?: Point | null
  /** 이 층에서 지나가는 길 */
  path?: Point[]
}
interface FloorPlanFigureProps extends FloorPlanMarks {
  floorPlan: FloorPlanInfo
  imageUrl: string
  /** 실제 방 모양 강조 이미지 (없으면 사각형) */
  roomShape: string | null
  label: string
  onPick?: (point: Point) => void
  /** 도면을 눌렀을 때 (크게 보기) */
  onOpen?: () => void
}

/**
 * 도면 이미지 + 표시. 부모 상자를 꽉 채워요 (카드 · 크게 보기 팝업 공통).
 * 상자 비율을 도면 width:height와 같게 두고 SVG viewBox도 같은 크기로 겹쳐서 서버 좌표를 그대로 써요.
 */
function FloorPlanFigure({
  floorPlan,
  imageUrl,
  roomShape,
  label,
  onPick,
  onOpen,
  area,
  destination,
  start,
  path,
}: FloorPlanFigureProps) {
  const { width, height } = floorPlan
  // 표시 크기는 도면 크기에 비례해서 정해요 (도면이 작아도 점 · 선이 보이게)
  const unit = Math.max(width, height) / 120

  /** 화면 클릭 좌표 → 도면 좌표 (SVG가 실제로 그린 변환을 거꾸로 적용해서 배율 · 여백과 상관없이 정확해요) */
  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onPick) {
      onOpen?.()
      return
    }
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const clamp = (value: number, max: number) => Math.round(Math.min(Math.max(value, 0), max) * 10) / 10
    onPick({ x: clamp(point.x, width), y: clamp(point.y, height) })
  }

  return (
    <>
      <img src={imageUrl} alt={label} className="absolute inset-0 size-full select-none" draggable={false} />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        // 이미지(size-full)가 상자를 꽉 채우니 SVG도 똑같이 꽉 채워요.
        // 기본값(xMidYMid meet)은 비율을 지키며 가운데 정렬이라, 테두리 · 반올림으로 상자 비율이
        // 1px만 달라도 이미지와 표시가 어긋나요. (632×184 상자에서 2px 어긋나는 것 확인)
        preserveAspectRatio="none"
        className={`absolute inset-0 size-full ${onPick ? 'cursor-crosshair' : onOpen ? 'cursor-zoom-in' : ''}`}
        onClick={onPick || onOpen ? handleClick : undefined}
        aria-hidden
      >
        {roomShape ? (
          <image href={roomShape} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />
        ) : (
          area && (
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
          )
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
    </>
  )
}

export default FloorPlanFigure
