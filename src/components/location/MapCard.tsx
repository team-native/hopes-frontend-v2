import { MapPin } from 'lucide-react'

interface MapCardProps {
  /** 화면 낭독기용 설명 (예: "광주소프트웨어마이스터고 위치") */
  label: string
  onClick?: () => void
}

/**
 * 위치 카드 (Location/Map Card)
 * TODO: 지금은 시안 모양의 그림이에요. 실제 지도(카카오맵·네이버지도 등)를 붙일지 정해지면 교체
 */
function MapCard({ label, onClick }: MapCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative block aspect-[328/206] w-full overflow-hidden rounded-lg bg-bg-canvas-deep"
    >
      {/* 지도 블록 장식 */}
      <span className="absolute top-[8%] left-[4%] h-[20%] w-[28%] rounded-sm bg-bg-surface/70" aria-hidden />
      <span className="absolute top-[4%] left-[37%] h-[34%] w-[22%] rounded-sm bg-bg-surface/70" aria-hidden />
      <span className="absolute top-[12%] left-[65%] h-[20%] w-[32%] rounded-sm bg-bg-surface/70" aria-hidden />
      <span className="absolute top-[47%] left-[9%] h-[26%] w-[37%] rounded-sm bg-bg-surface/70" aria-hidden />
      <span className="absolute top-[55%] left-[60%] h-[38%] w-[28%] rounded-sm bg-bg-surface/70" aria-hidden />
      {/* 핀 */}
      <span className="absolute top-1/2 left-1/2 flex size-[30%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bg-brand/15" aria-hidden>
        <span className="flex size-9 items-center justify-center rounded-full bg-bg-brand text-icon-on-brand shadow-cloud-brand">
          <MapPin className="size-4" strokeWidth={2} />
        </span>
      </span>
    </button>
  )
}

export default MapCard
