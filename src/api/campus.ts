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

export async function checkCampusLocation(location: LocationRequest) {
  const { data } = await client.post<CampusLocationResult>('/api/campus/location-check', location)
  return data
}
