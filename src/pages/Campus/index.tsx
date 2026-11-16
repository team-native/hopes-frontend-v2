import { useEffect, useState, type FormEvent } from 'react'
import { checkCampusLocation, getCampusFacilities, getCampusMap, getFloorPlans, type CampusLocationResult } from '../../api/campus'
import type { LocationRequest } from '../../api/chats'
import BackButton from '../../components/common/BackButton'
import Button from '../../components/common/Button'
import TextField from '../../components/common/TextField'
import Toast from '../../components/common/Toast'
import { InlineError } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import SectionHeader from '../../components/layout/SectionHeader'
import useToast from '../../hooks/useToast'

type Payload = Record<string, unknown>

function CampusPage() {
  const { toast, showToast } = useToast()
  const [map, setMap] = useState<Payload | null>(null)
  const [facilities, setFacilities] = useState<Payload | null>(null)
  const [floorPlan, setFloorPlan] = useState<Payload | null>(null)
  const [keyword, setKeyword] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [floor, setFloor] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [locationResult, setLocationResult] = useState<CampusLocationResult | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    getCampusMap()
      .then((data) => {
        if (active) setMap(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])

  async function searchFacilities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setFacilities(await getCampusFacilities({
        keyword: keyword.trim() || undefined,
        buildingId: buildingFilter ? Number(buildingFilter) : undefined,
        floor: floor.trim() || undefined,
      }))
    } catch {
      showToast('시설 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function loadFloorPlan() {
    const id = Number(buildingId)
    if (!Number.isInteger(id) || id <= 0) {
      showToast('건물 ID를 입력해 주세요.')
      return
    }
    try {
      setFloorPlan(await getFloorPlans(id))
    } catch {
      showToast('층별 도면을 불러오지 못했어요. 건물 ID를 확인해 주세요.')
    }
  }

  async function checkLocation() {
    if (!navigator.geolocation) {
      showToast('이 브라우저에서는 현재 위치를 사용할 수 없어요.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords, timestamp }) => {
        const request: LocationRequest = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          horizontalAccuracyMeters: coords.accuracy,
          measuredAt: new Date(timestamp).toISOString(),
        }
        try {
          setLocationResult(await checkCampusLocation(request))
        } catch {
          showToast('위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
        }
      },
      () => showToast('브라우저에서 위치 권한을 허용해 주세요.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  return (
    <AppLayout activeMenu={null}>
      <main className="mx-auto w-full max-w-[900px] space-y-lg px-5 py-5 md:px-8 md:py-6">
        <header>
          <BackButton onClick={() => window.history.back()}>돌아가기</BackButton>
          <h1 className="mt-md text-title">학교 위치와 시설</h1>
          <p className="mt-1 text-caption text-text-secondary">학교 지도, 시설 정보와 층별 도면을 확인해요.</p>
        </header>

        <section className="space-y-sm">
          <SectionHeader title="학교 지도" />
          {error ? (
            <InlineError title="지도를 불러오지 못했어요" onRetry={() => window.location.reload()} />
          ) : map ? (
            <PayloadView value={map} />
          ) : (
            <p role="status" className="rounded-lg border border-border-subtle bg-bg-surface p-md text-caption text-text-secondary">지도를 불러오는 중이에요…</p>
          )}
        </section>

        <section className="space-y-sm">
          <SectionHeader title="시설 검색" />
          <form className="grid grid-cols-1 gap-2 sm:grid-cols-4" onSubmit={searchFacilities}>
            <TextField label="시설명" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="시설명 입력" />
            <TextField label="건물 ID" type="number" value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)} />
            <TextField label="층" value={floor} onChange={(event) => setFloor(event.target.value)} placeholder="예: 2층" />
            <Button type="submit" className="mt-6 shrink-0">검색</Button>
          </form>
          {facilities && <PayloadView value={facilities} />}
        </section>

        <section className="space-y-sm">
          <SectionHeader title="층별 도면" />
          <div className="flex items-end gap-2">
            <TextField label="건물 ID" type="number" value={buildingId} onChange={(event) => setBuildingId(event.target.value)} />
            <Button onClick={() => void loadFloorPlan()}>도면 보기</Button>
          </div>
          {floorPlan && <PayloadView value={floorPlan} />}
        </section>

        <section className="space-y-sm rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
          <SectionHeader title="현재 위치 확인" />
          <p className="text-caption text-text-secondary">위치 확인 버튼을 눌렀을 때만 현재 위치를 서버에 전송해요.</p>
          <Button onClick={() => void checkLocation()}>현재 위치 확인</Button>
          {locationResult && <p role="status" className="text-label">{locationResult.message}</p>}
        </section>
      </main>
      <Toast message={toast} />
    </AppLayout>
  )
}

function PayloadView({ value }: { value: Payload }) {
  return <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border-subtle bg-bg-surface p-md text-caption">{JSON.stringify(value, null, 2)}</pre>
}

export default CampusPage
