import client from './client'

export type AttachmentDto = {
  id: number
  fileName: string
  mimeType: string
  sizeBytes: number
  status: string
  previewUrl?: string | null
  type: string
  expiresAt: string
}

export type ChatMessage = {
  id: number
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
  attachments: AttachmentDto[]
  analysisStatus?: string | null
  contentFormat: string
  /** 위치 질문의 도면 카드 (일반 대화는 null) — 서버 docs/CHAT_LOCATION_CARDS.md */
  location?: ChatLocation | null
}

/** 도면 한 장. width · height는 이미지 픽셀 크기이자 좌표 기준이에요 */
export type FloorPlanInfo = {
  id: string
  label: string
  url: string
  width: number
  height: number
  floor: string
  group: string
  buildingId: number
}

/**
 * 도면 위 장소 (x · y는 문 또는 복도 접점, area는 방 전체 사각형)
 * 층 전체 도면 카드(type "FLOOR")는 특정 지점이 아니라서 x · y · area가 null이에요.
 */
export type LocationPlace = {
  id?: string
  name?: string
  /** ROOM · RESTROOM · AREA · FLOOR(층 전체) 등 */
  type?: string
  buildingId?: number
  buildingName?: string | null
  floor: string
  floorPlanId: string
  x: number | null
  y: number | null
  area?: { x: number; y: number; width: number; height: number } | null
  note?: string | null
}

export type LocationCandidate = {
  place: LocationPlace
  floorPlan: FloorPlanInfo
  /** false면 길찾기 목적지로 쓸 수 없는 후보 (층 전체 도면) */
  routable?: boolean
}

export type RouteIndoorLeg = {
  type: 'INDOOR'
  floorPlan: FloorPlanInfo
  path: { x: number; y: number }[]
  /** 이 층 다음 이동 (계단 · 엘리베이터 · 건물 밖). 마지막 구간은 null */
  next?: { type: 'STAIR' | 'ELEVATOR'; toFloor: string } | { type: 'OUTDOOR'; toGroup: string } | null
}

export type RouteOutdoorLeg = {
  type: 'OUTDOOR'
  from: { placeId: string; name: string; buildingName?: string | null }
  to: { placeId: string; name: string; buildingName?: string | null }
  distanceMeters: number
  estimated: boolean
  note?: string | null
}

export type ChatRoute = {
  from: LocationPlace
  to: LocationPlace
  elevatorOnly: boolean
  distanceMeters: number
  floorsMoved: number
  estimatedSeconds: number
  legs: (RouteIndoorLeg | RouteOutdoorLeg)[]
  steps: string[]
}

export type ChatLocation = {
  /**
   * DESTINATION_READY: 목적지 하나 · SELECT_DESTINATION: 후보 여러 개 · ROUTE_READY: 경로 포함
   * FLOOR_OVERVIEW: 건물 · 층을 물었을 때 층 전체 도면 목록 (예: "기숙사", "본관 4층")
   * LOCATION_UNVERIFIED: 공개 자료에서 위치를 확인하지 못함 → 안내 문구 + 참고 도면만 (마커 · 경로 없음)
   */
  status:
    | 'DESTINATION_READY'
    | 'SELECT_DESTINATION'
    | 'ROUTE_READY'
    | 'FLOOR_OVERVIEW'
    | 'LOCATION_UNVERIFIED'
    | (string & {})
  requiresOrigin: boolean
  candidates: LocationCandidate[]
  /** 층 전체 도면 목록 (FLOOR_OVERVIEW · LOCATION_UNVERIFIED) */
  floorPlans?: FloorPlanInfo[] | null
  /** 서버 안내 문구 (FLOOR_OVERVIEW · LOCATION_UNVERIFIED) */
  message?: string | null
  route?: ChatRoute | null
}

/** 위치 질문에 붙이는 길찾기 정보 (목적지 선택 · 출발 위치 · 엘리베이터만) */
export type ChatNavigationRequest = {
  destinationPlaceId?: string
  /** 장소 id 또는 "도면ID@x,y" */
  navigationOrigin?: string
  elevatorOnly?: boolean
}

export type ChatResponse = {
  id: number
  title: string
  messages: ChatMessage[]
  messagePage: number
  messageSize: number
  hasMoreMessages: boolean
}

export type ChatSummary = { id: number; title: string; updatedAt: string }
export type MainResponse = {
  chatList: ChatSummary[]
  newChat: boolean
  searchKeyword?: string | null
  page: number
  size: number
  hasNext: boolean
}

export async function getMain(params: { searchKeyword?: string; page?: number; size?: number } = {}) {
  const { data } = await client.get<MainResponse>('/api/main', { params })
  return data
}

export async function createChat(title: string) {
  const { data } = await client.post<ChatResponse>('/api/chats', { title })
  return data
}

export async function getChat(id: string, params: { messagePage?: number; messageSize?: number } = {}) {
  const { data } = await client.get<ChatResponse>(`/api/chats/${encodeURIComponent(id)}`, { params })
  return data
}

/**
 * 메시지 전송 + AI 답변 (서버가 답변까지 만든 뒤 응답해서 최대 60초쯤 걸릴 수 있어요)
 * clientRequestId: 같은 질문을 다시 보낼 때 같은 값을 넘기면 서버가 한 번만 저장해요.
 * (이미 저장됐으면 저장된 대화를 그대로 돌려줘요. 내용이 다르면 409)
 */
export async function sendChatMessage(
  id: string,
  content: string,
  attachmentIds: number[],
  preferences: { departmentId?: number; specialtyId?: number } = {},
  clientRequestId?: string,
  navigation: ChatNavigationRequest = {},
) {
  const { data } = await client.post<ChatResponse>(`/api/chats/${encodeURIComponent(id)}/messages`, {
    content,
    attachmentIds,
    ...preferences,
    ...navigation,
    clientRequestId,
  })
  return data
}

/** 대화 개별 삭제 (본인 대화가 아니거나 이미 지워졌으면 404) */
export async function deleteChat(id: string) {
  await client.delete(`/api/chats/${encodeURIComponent(id)}`)
}

/**
 * 첨부 업로드 (PNG · JPEG · PDF)
 * clientRequestId: 같은 파일을 다시 올릴 때 같은 값을 넘기면 서버가 같은 첨부를 돌려줘요.
 */
export async function uploadChatAttachment(file: File, clientRequestId?: string) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post<AttachmentDto>('/api/attachments', form, {
    params: clientRequestId ? { clientRequestId } : undefined,
  })
  return data
}

export async function getAttachment(id: number) {
  const { data } = await client.get<AttachmentDto>(`/api/attachments/${id}`)
  return data
}

export async function getAttachmentContent(id: number) {
  const { data } = await client.get<Blob>(`/api/attachments/${id}/content`, { responseType: 'blob' })
  return data
}

export async function deleteAttachment(id: number) {
  await client.delete(`/api/attachments/${id}`)
}

export type LocationRequest = {
  latitude: number
  longitude: number
  horizontalAccuracyMeters: number
  measuredAt: string
  clientRequestId?: string
}

/** 대화 화면 위치 확인 응답 — 결과는 locationResult 안에 있어요 */
export type ChatLocationResponse = {
  chatId: number
  cardType: 'LOCATION'
  locationResult: {
    /** NEAR_SCHOOL · OUTSIDE · LOW_ACCURACY · UNKNOWN */
    status: string
    accuracyMeters: number
    message: string
    floorPlansAvailable: boolean
    matchedBuilding?: number | null
  }
}

export async function sendLocationCheck(id: string, location: LocationRequest) {
  const { data } = await client.post<ChatLocationResponse>(
    `/api/chats/${encodeURIComponent(id)}/location-check`,
    location,
  )
  return data
}
