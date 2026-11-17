import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import type { FloorPlanInfo } from '../../api/chats'
import IconButton from '../common/IconButton'
import Modal from '../common/Modal'
import FloorPlanFigure, { type FloorPlanMarks } from './FloorPlanFigure'

interface FloorPlanZoomDialogProps extends FloorPlanMarks {
  open: boolean
  onClose: () => void
  floorPlan: FloorPlanInfo
  imageUrl: string
  roomShape: string | null
  label: string
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const STEP = 1.5

type View = { scale: number; x: number; y: number }
const INITIAL: View = { scale: 1, x: 0, y: 0 }

/**
 * 도면 크게 보기 팝업
 * - 확대 · 축소: + / − 버튼, 마우스 휠(가리킨 곳 기준), 두 손가락 벌리기 · 오므리기(휴대폰), 두 번 누르기
 * - 이동: 확대한 상태에서 끌기 (마우스 · 손가락 하나)
 * - 브라우저 기본 확대 · 스크롤은 막고(touch-none) 위 동작으로 대신해요.
 * - 도면 밖으로 빈 곳이 보이지 않게 이동 범위를 막아요.
 */
function FloorPlanZoomDialog({
  open,
  onClose,
  floorPlan,
  imageUrl,
  roomShape,
  label,
  ...marks
}: FloorPlanZoomDialogProps) {
  const titleId = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>(INITIAL)
  /** 화면에 닿아 있는 손가락 · 마우스 (뷰포트 기준 위치) */
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  /** 끌기(손가락 하나) 또는 두 손가락 확대가 시작될 때의 상태 */
  const gestureRef = useRef<
    | { type: 'drag'; startX: number; startY: number; origin: View }
    | { type: 'pinch'; startDistance: number; startMidX: number; startMidY: number; origin: View }
    | null
  >(null)

  /** 이동 범위 제한: 확대한 도면이 화면(뷰포트)을 항상 덮도록 */
  function clampView(next: View): View {
    const box = viewportRef.current?.getBoundingClientRect()
    if (!box) return next
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale))
    const minX = box.width * (1 - scale)
    const minY = box.height * (1 - scale)
    return {
      scale,
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    }
  }

  /** (originX, originY) 지점(뷰포트 기준 px)이 제자리에 있도록 배율 바꾸기 */
  function zoomAt(factor: number, originX?: number, originY?: number) {
    setView((current) => {
      const box = viewportRef.current?.getBoundingClientRect()
      const ox = originX ?? (box ? box.width / 2 : 0)
      const oy = originY ?? (box ? box.height / 2 : 0)
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor))
      const ratio = scale / current.scale
      return clampView({ scale, x: ox - (ox - current.x) * ratio, y: oy - (oy - current.y) * ratio })
    })
  }

  // 휠 확대 · 축소: 페이지가 같이 스크롤되지 않게 passive: false로 직접 등록해요
  useEffect(() => {
    const viewport = viewportRef.current
    if (!open || !viewport) return
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const box = viewport!.getBoundingClientRect()
      zoomAt(event.deltaY < 0 ? 1.2 : 1 / 1.2, event.clientX - box.left, event.clientY - box.top)
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
    // zoomAt은 setView(함수형)만 써서 매번 새로 등록하지 않아도 돼요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /** 뷰포트 기준 좌표 */
  function localPoint(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  /** 지금 닿아 있는 손가락 수에 맞춰 제스처를 새로 시작해요 (하나 = 끌기, 둘 = 두 손가락 확대) */
  function startGesture(current: View) {
    const points = [...pointersRef.current.values()]
    if (points.length >= 2) {
      const [a, b] = points
      gestureRef.current = {
        type: 'pinch',
        startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startMidX: (a.x + b.x) / 2,
        startMidY: (a.y + b.y) / 2,
        origin: current,
      }
    } else if (points.length === 1 && current.scale > 1) {
      gestureRef.current = { type: 'drag', startX: points[0].x, startY: points[0].y, origin: current }
    } else {
      gestureRef.current = null
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, localPoint(event))
    startGesture(view)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, localPoint(event))
    const gesture = gestureRef.current
    if (!gesture) return
    if (gesture.type === 'drag') {
      const [point] = pointersRef.current.values()
      setView(
        clampView({
          scale: gesture.origin.scale,
          x: gesture.origin.x + point.x - gesture.startX,
          y: gesture.origin.y + point.y - gesture.startY,
        }),
      )
      return
    }
    // 두 손가락: 벌린 만큼 확대하고, 두 손가락 가운데가 움직인 만큼 같이 이동해요
    const [a, b] = pointersRef.current.values()
    if (!b) return
    const { origin } = gesture
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, origin.scale * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.startDistance)),
    )
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    const ratio = scale / origin.scale
    setView(
      clampView({
        scale,
        x: midX - (gesture.startMidX - origin.x) * ratio,
        y: midY - (gesture.startMidY - origin.y) * ratio,
      }),
    )
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.delete(event.pointerId)) return
    // 두 손가락 중 하나를 떼면 남은 손가락으로 이어서 끌 수 있게 다시 시작해요
    setView((current) => {
      startGesture(current)
      return current
    })
  }

  function close() {
    setView(INITIAL)
    pointersRef.current.clear()
    gestureRef.current = null
    onClose()
  }

  const percent = Math.round(view.scale * 100)

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} closeOnBackdrop className="w-[min(96vw,1100px)] p-md">
      <div className="mb-sm flex items-center justify-between gap-2">
        <h2 id={titleId} className="truncate text-label font-medium">
          {floorPlan.label} 도면
        </h2>
        <div className="flex items-center gap-1">
          <IconButton icon={Minus} label="축소" onClick={() => zoomAt(1 / STEP)} disabled={view.scale <= MIN_SCALE} />
          <span className="w-12 text-center text-caption text-text-secondary tabular-nums" aria-live="polite">
            {percent}%
          </span>
          <IconButton icon={Plus} label="확대" onClick={() => zoomAt(STEP)} disabled={view.scale >= MAX_SCALE} />
          <IconButton icon={RotateCcw} label="원래 크기" onClick={() => setView(INITIAL)} disabled={view.scale === 1} />
          <IconButton icon={X} label="닫기" onClick={close} />
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative w-full touch-none overflow-hidden rounded-md border border-border-subtle bg-bg-surface select-none ${
          view.scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        style={{ aspectRatio: `${floorPlan.width} / ${floorPlan.height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          zoomAt(STEP, event.clientX - box.left, event.clientY - box.top)
        }}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <FloorPlanFigure floorPlan={floorPlan} imageUrl={imageUrl} roomShape={roomShape} label={label} {...marks} />
        </div>
      </div>
      <p className="mt-xs text-caption text-text-tertiary">
        휠 · 두 손가락 · + / − 버튼으로 확대 · 축소하고, 확대한 뒤에는 끌어서 움직일 수 있어요. 두 번 누르면 그 자리를
        확대해요.
      </p>
    </Modal>
  )
}

export default FloorPlanZoomDialog
