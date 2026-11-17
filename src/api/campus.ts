import client from './client'
import type { LocationRequest } from './chats'

export type CampusLocationResult = {
  status: string
  accuracyMeters: number
  message: string
  floorPlansAvailable: boolean
  matchedBuilding?: number | null
}

export async function getCampusMap() {
  const { data } = await client.get<Record<string, unknown>>('/api/campus/map')
  return data
}

export async function getCampusFacilities(params: { keyword?: string; buildingId?: number; floor?: string } = {}) {
  const { data } = await client.get<Record<string, unknown>>('/api/campus/facilities', { params })
  return data
}

export async function getFloorPlans(buildingId: number) {
  const { data } = await client.get<Record<string, unknown>>(`/api/campus/buildings/${buildingId}/floor-plans`)
  return data
}

/** 길찾기 장소 (출발 위치 검색 결과) */
export type NavigationPlace = {
  id: string
  name: string
  type: string
  buildingId: number
  buildingName?: string | null
  floor: string
  floorPlanId: string
  note?: string | null
}

/** 공개된 길찾기 장소 검색 (q가 비면 전체) */
export async function searchNavigationPlaces(q: string) {
  const { data } = await client.get<{ available: boolean; items: NavigationPlace[] }>('/api/campus/navigation/places', {
    params: q.trim() ? { q: q.trim() } : undefined,
  })
  return data
}

/**
 * 도면 이미지 받기 — 로그인 토큰(Bearer)이 필요해서 <img src>로 바로 쓰지 않고 axios로 받아요.
 * 응답의 url은 서버 절대 주소라, 같은 경로를 우리 /api 프록시로 요청해요 (CORS · 혼합 콘텐츠 방지).
 */
export async function getFloorPlanImage(floorPlanId: string) {
  const { data } = await client.get<Blob>(`/api/campus/floor-plans/${encodeURIComponent(floorPlanId)}/image`, {
    responseType: 'blob',
  })
  return data
}

export async function checkCampusLocation(location: LocationRequest) {
  const { data } = await client.post<CampusLocationResult>('/api/campus/location-check', location)
  return data
}
