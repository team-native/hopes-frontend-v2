interface CardSkeletonProps {
  /** 몇 장 보여 줄지 */
  count?: number
  /** 화면 낭독기용 설명 */
  label?: string
}

/** 카드 목록을 불러오는 동안 보여 주는 회색 자리표시 */
function CardSkeleton({ count = 3, label = '불러오는 중' }: CardSkeletonProps) {
  return (
    <div className="space-y-sm" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[114px] animate-pulse rounded-lg border border-border-subtle bg-bg-surface p-md">
          <div className="h-5 w-10 rounded-full bg-bg-canvas" />
          <div className="mt-3 h-3 w-1/3 rounded-full bg-bg-canvas" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-bg-canvas" />
        </div>
      ))}
    </div>
  )
}

export default CardSkeleton
