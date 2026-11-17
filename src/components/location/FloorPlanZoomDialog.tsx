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
 * - 확대 · 축소: + / − 버튼, 마우스 휠(가리킨 곳 기준), 두 번 누르기(그 자리 확대)
 * - 이동: 확대한 상태에서 끌기 (마우스 · 터치)
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
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origin: View } | null>(null)

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

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (view.scale <= 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: view }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setView(
      clampView({
        scale: drag.origin.scale,
        x: drag.origin.x + event.clientX - drag.startX,
        y: drag.origin.y + event.clientY - drag.startY,
      }),
    )
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  function close() {
    setView(INITIAL)
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
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
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
        휠이나 + / − 버튼으로 확대 · 축소하고, 확대한 뒤에는 끌어서 움직일 수 있어요. 두 번 누르면 그 자리를 확대해요.
      </p>
    </Modal>
  )
}

export default FloorPlanZoomDialog
