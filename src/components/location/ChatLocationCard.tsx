import { ArrowRight, Footprints, MapPin } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { searchNavigationPlaces, type NavigationPlace } from '../../api/campus'
import type {
  ChatLocation,
  ChatNavigationRequest,
  ChatRoute,
  LocationCandidate,
  LocationPlace,
  RouteIndoorLeg,
  RouteOutdoorLeg,
} from '../../api/chats'
import Button from '../common/Button'
import Checkbox from '../common/Checkbox'
import FieldError from '../common/FieldError'
import SearchField from '../common/SearchField'
import FloorPlanView from './FloorPlanView'

interface ChatLocationCardProps {
  location: ChatLocation
  /** 목적지 선택 · 길찾기 요청을 새 메시지로 보내요 (보내는 중이면 막아요) */
  onNavigate: (content: string, navigation: ChatNavigationRequest) => void
  disabled?: boolean
}

/**
 * 채팅 답변 아래 도면 카드 (서버 docs/CHAT_LOCATION_CARDS.md)
 * - SELECT_DESTINATION: 같은 이름 장소가 여러 곳 → 후보 고르기
 * - DESTINATION_READY: 목적지 도면 + 출발 위치 고르기
 * - ROUTE_READY: 층별 도면에 길 표시 + 단계 안내
 */
function ChatLocationCard({ location, onNavigate, disabled = false }: ChatLocationCardProps) {
  const destination = location.candidates[0]

  if (location.status === 'ROUTE_READY' && location.route) {
    return <RouteCard route={location.route} destination={destination} />
  }
  if (location.status === 'SELECT_DESTINATION' || location.candidates.length > 1) {
    return <SelectDestination candidates={location.candidates} onNavigate={onNavigate} disabled={disabled} />
  }
  if (!destination) return null
  return <DestinationCard destination={destination} onNavigate={onNavigate} disabled={disabled} />
}

function placeTitle({ place, floorPlan }: LocationCandidate) {
  return `${place.name ?? '목적지'} · ${floorPlan.label}`
}

function CardFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="mt-sm space-y-sm rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm"
      aria-label={title}
    >
      <h3 className="flex items-center gap-1.5 text-label font-medium">
        <MapPin className="size-4 text-icon-brand" strokeWidth={2} aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  )
}

/** 같은 이름 장소가 여러 층에 있을 때 후보 고르기 */
function SelectDestination({
  candidates,
  onNavigate,
  disabled,
}: {
  candidates: LocationCandidate[]
  onNavigate: ChatLocationCardProps['onNavigate']
  disabled: boolean
}) {
  return (
    <CardFrame title="어느 곳을 찾으세요?">
      <ul className="space-y-xs">
        {candidates.map((candidate) => (
          <li key={candidate.place.id ?? candidate.floorPlan.id}>
            <button
              type="button"
              disabled={disabled || !candidate.place.id}
              onClick={() =>
                onNavigate(`${candidate.place.name ?? '이곳'} 위치 알려줘`, { destinationPlaceId: candidate.place.id })
              }
              className="flex w-full items-center justify-between gap-2 rounded-sm border border-border-subtle px-3 py-2.5 text-left text-label transition hover:border-border-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="min-w-0 truncate">{placeTitle(candidate)}</span>
              <ArrowRight className="size-4 shrink-0 text-icon-muted" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </CardFrame>
  )
}

/** 목적지 도면 + 출발 위치 고르기 (도면을 누르거나 장소를 검색) */
function DestinationCard({
  destination,
  onNavigate,
  disabled,
}: {
  destination: LocationCandidate
  onNavigate: ChatLocationCardProps['onNavigate']
  disabled: boolean
}) {
  const { place, floorPlan } = destination
  const [picking, setPicking] = useState(false)
  const [pickedPoint, setPickedPoint] = useState<{ x: number; y: number } | null>(null)
  const [originPlace, setOriginPlace] = useState<NavigationPlace | null>(null)
  const [elevatorOnly, setElevatorOnly] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<NavigationPlace[] | null>(null)
  const [searchError, setSearchError] = useState('')

  const origin = originPlace
    ? {
        spec: originPlace.id,
        text: `${originPlace.buildingName ?? ''} ${originPlace.floor} ${originPlace.name}`.trim(),
      }
    : pickedPoint
      ? { spec: `${floorPlan.id}@${pickedPoint.x},${pickedPoint.y}`, text: `${floorPlan.label} 도면에서 고른 위치` }
      : null

  async function search() {
    setSearchError('')
    try {
      const { available, items } = await searchNavigationPlaces(keyword)
      if (!available) setSearchError('길찾기 자료가 아직 준비되지 않았어요.')
      setResults(items.filter(({ id }) => id !== place.id).slice(0, 8))
    } catch {
      setSearchError('장소를 찾지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <CardFrame title={placeTitle(destination)}>
      <FloorPlanView
        floorPlan={floorPlan}
        area={place.area}
        destination={place}
        // 고른 출발점은 고르기를 꺼도 계속 보여 줘요 (아래 "출발: …" 문구와 맞추기)
        start={pickedPoint}
        onPick={
          picking
            ? (point) => {
                setPickedPoint(point)
                setOriginPlace(null)
              }
            : undefined
        }
        label={`${floorPlan.label} 도면, ${place.name ?? '목적지'} 표시`}
      />
      {place.note && <p className="text-caption text-text-secondary">{place.note}</p>}

      <div className="space-y-xs border-t border-border-subtle pt-sm">
        <p className="text-label font-medium">길찾기 — 지금 어디에 있나요?</p>
        <p className="text-caption text-text-tertiary">
          GPS로는 층을 알 수 없어서 출발 위치를 직접 골라 주세요. 길 안내는 저장되지 않아서, 새로고침했다면 출발 위치를
          다시 골라 주세요.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={picking ? 'soft' : 'secondary'}
            aria-pressed={picking}
            onClick={() => setPicking((value) => !value)}
          >
            {picking ? '도면에서 고르는 중' : `${floorPlan.label}에 있어요 (도면에서 고르기)`}
          </Button>
        </div>
        {picking && !pickedPoint && (
          <p className="text-caption text-text-brand">
            도면에서 지금 있는 곳을 눌러 주세요. 키보드로는 아래 장소 검색을 이용해 주세요.
          </p>
        )}

        <SearchField
          value={keyword}
          onChange={setKeyword}
          onSearch={() => void search()}
          placeholder="다른 층이면 출발 장소 검색 (예: 3층 교실, 도서관)"
        />
        {searchError && <FieldError>{searchError}</FieldError>}
        {results && results.length === 0 && !searchError && (
          <p className="text-caption text-text-tertiary">검색 결과가 없어요.</p>
        )}
        {results && results.length > 0 && (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={originPlace?.id === item.id}
                  onClick={() => {
                    setOriginPlace(item)
                    setPickedPoint(null)
                    setPicking(false)
                  }}
                  className={`w-full rounded-sm px-3 py-2 text-left text-label transition hover:bg-bg-canvas ${
                    originPlace?.id === item.id ? 'bg-bg-brand-soft font-medium text-text-brand' : ''
                  }`}
                >
                  {item.name}
                  <span className="ml-1.5 text-caption text-text-tertiary">
                    {item.buildingName} {item.floor}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Checkbox className="text-label" checked={elevatorOnly} onChange={(e) => setElevatorOnly(e.target.checked)}>
          엘리베이터로만 이동
        </Checkbox>

        {origin && <p className="text-caption text-text-secondary">출발: {origin.text}</p>}
        <Button
          size="sm"
          disabled={!origin || disabled || !place.id}
          onClick={() =>
            origin &&
            onNavigate(`여기서 ${place.name ?? '목적지'}까지 안내해줘`, {
              destinationPlaceId: place.id,
              navigationOrigin: origin.spec,
              elevatorOnly,
            })
          }
        >
          길 안내 받기
        </Button>
      </div>
    </CardFrame>
  )
}

/** 경로: 요약 + 층별 도면에 길 + 단계 안내 */
function RouteCard({ route, destination }: { route: ChatRoute; destination?: LocationCandidate }) {
  const minutes = Math.max(1, Math.round(route.estimatedSeconds / 60))
  const indoorLegs = route.legs.filter((leg): leg is RouteIndoorLeg => leg.type === 'INDOOR')
  const firstIndoor = indoorLegs[0]
  const lastIndoor = indoorLegs.at(-1)

  return (
    <CardFrame title={`${destination?.place.name ?? route.to.name ?? '목적지'}까지 길 안내`}>
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <Footprints className="size-4 text-icon-muted" aria-hidden />약 {route.distanceMeters}m · {minutes}분
        {route.floorsMoved > 0 && ` · ${route.floorsMoved}개 층 이동`}
        {route.elevatorOnly && ' · 엘리베이터만'}
      </p>

      <ol className="space-y-sm">
        {route.legs.map((leg, index) => (
          <li key={index}>
            {leg.type === 'INDOOR' ? (
              <IndoorLeg
                leg={leg}
                start={leg === firstIndoor ? route.from : leg.path[0]}
                end={leg === lastIndoor ? route.to : null}
                area={leg === lastIndoor ? (route.to.area ?? destination?.place.area) : null}
              />
            ) : (
              <OutdoorLeg leg={leg} />
            )}
          </li>
        ))}
      </ol>

      <details className="text-label">
        <summary className="cursor-pointer text-caption font-medium text-text-brand">단계별 안내 보기</summary>
        <ol className="mt-xs list-decimal space-y-1 pl-5 text-caption text-text-secondary">
          {route.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </details>
      <p className="text-caption text-text-tertiary">거리와 시간은 도면 기준 추정값이에요.</p>
    </CardFrame>
  )
}

const NEXT_TEXT = { STAIR: '계단', ELEVATOR: '엘리베이터' } as const

function IndoorLeg({
  leg,
  start,
  end,
  area,
}: {
  leg: RouteIndoorLeg
  start?: { x: number; y: number } | null
  end?: { x: number; y: number } | null
  area?: LocationPlace['area']
}) {
  const next = leg.next
  return (
    <div className="space-y-1.5">
      <p className="text-caption font-medium text-text-primary">{leg.floorPlan.label}</p>
      <FloorPlanView
        floorPlan={leg.floorPlan}
        path={leg.path}
        start={start}
        destination={end}
        area={area}
        label={`${leg.floorPlan.label} 도면, 이동 경로 표시`}
      />
      {next && (
        <p className="text-caption text-text-secondary">
          {next.type === 'OUTDOOR'
            ? `건물 밖으로 나가 ${next.toGroup}(으)로 이동`
            : `${NEXT_TEXT[next.type]}로 ${next.toFloor} 이동`}
        </p>
      )}
    </div>
  )
}

function OutdoorLeg({ leg }: { leg: RouteOutdoorLeg }) {
  return (
    <p className="rounded-sm bg-bg-canvas px-3 py-2 text-caption text-text-secondary">
      {leg.from.name}에서 나가 {leg.to.buildingName} {leg.to.name}(으)로 이동 · 약 {leg.distanceMeters}m
      {leg.estimated && ' (추정)'}
    </p>
  )
}

export default ChatLocationCard
