import { Maximize2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFloorPlanImage } from '../../api/campus'
import type { FloorPlanInfo } from '../../api/chats'
import FloorPlanFigure, { type FloorPlanMarks, type Point } from './FloorPlanFigure'
import FloorPlanZoomDialog from './FloorPlanZoomDialog'
import { computeRoomShape } from './roomShape'

interface FloorPlanViewProps extends FloorPlanMarks {
  floorPlan: FloorPlanInfo
  /** 넘기면 도면을 눌러 위치를 고를 수 있어요 (도면 좌표로 돌려줘요) */
  onPick?: (point: Point) => void
  /** 화면 낭독기용 설명 */
  label: string
}

/**
 * 도면 한 장 + 그 위 표시 (목적지 방 · 길 · 출발 · 도착)
 * - 이미지는 로그인 토큰이 필요해서 axios로 받아 blob 주소로 보여 주고, 카드가 사라지면 해제해요.
 * - 목적지 방은 서버 사각형 대신 도면에서 찾은 실제 방 모양으로 칠해요 (roomShape.ts). 못 찾으면 사각형.
 * - 도면을 누르거나 오른쪽 위 버튼을 누르면 크게 보기(확대 · 축소 · 이동) 팝업이 열려요.
 *   출발 위치를 고르는 중에는 도면 누르기가 "위치 고르기"라서 버튼으로만 열어요.
 */
function FloorPlanView({ floorPlan, onPick, label, ...marks }: FloorPlanViewProps) {
  const { id, url, width, height } = floorPlan
  const [image, setImage] = useState<{ id: string; url?: string; failed?: boolean }>({ id })
  const [retry, setRetry] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    getFloorPlanImage(url, id)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setImage({ id, url: objectUrl })
      })
      .catch(() => active && setImage({ id, failed: true }))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, url, retry])

  const current = image.id === id ? image : { id }
  const roomShape = useRoomShape(current.url, width, height, marks.area)

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-border-subtle bg-bg-surface"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {current.url ? (
        <>
          <FloorPlanFigure
            floorPlan={floorPlan}
            imageUrl={current.url}
            roomShape={roomShape}
            label={label}
            onPick={onPick}
            onOpen={onPick ? undefined : () => setZoomOpen(true)}
            {...marks}
          />
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={`${floorPlan.label} 도면 크게 보기`}
            className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-sm border border-border-subtle bg-bg-surface/90 text-icon-default shadow-cloud-sm transition hover:text-icon-brand"
          >
            <Maximize2 className="size-4" strokeWidth={2} aria-hidden />
          </button>
          <FloorPlanZoomDialog
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            floorPlan={floorPlan}
            imageUrl={current.url}
            roomShape={roomShape}
            label={label}
            {...marks}
          />
        </>
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
    </div>
  )
}

/** 도면 이미지가 준비되면 목적지 방의 실제 모양(강조 이미지)을 계산해요. 못 찾으면 null */
function useRoomShape(imageUrl: string | undefined, width: number, height: number, area: FloorPlanMarks['area']) {
  const [shape, setShape] = useState<{ key: string; url: string | null }>({ key: '', url: null })
  const key = imageUrl && area ? `${imageUrl}|${area.x},${area.y},${area.width},${area.height}` : ''

  useEffect(() => {
    if (!imageUrl || !area) return
    let active = true
    const image = new Image()
    image.onload = () => {
      if (!active) return
      // 강조색은 디자인 토큰(브랜드 파랑)에서 가져와요
      const brand = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-brand').trim() || 'blue'
      let url: string | null = null
      try {
        url = computeRoomShape(image, width, height, area, brand)
      } catch {
        url = null
      }
      setShape({ key: `${imageUrl}|${area.x},${area.y},${area.width},${area.height}`, url })
    }
    image.src = imageUrl
    return () => {
      active = false
    }
  }, [imageUrl, width, height, area])

  return shape.key === key ? shape.url : null
}

export default FloorPlanView
