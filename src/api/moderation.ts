import client from './client'

type Page<T> = { items: T[]; page: number; size: number; hasNext: boolean }

export type ReportSummaryDto = {
  id: number
  targetType: string
  targetId: number
  reasonCode: string
  status: 'RECEIVED' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  resolvedAt?: string | null
  sameTargetReportCount: number
}

export type ReportDetailDto = ReportSummaryDto & {
  targetPostId?: number | null
  detail: string
  evidence: { title?: string | null; content?: string | null; purgedAt?: string | null }
  currentTarget: { exists: boolean; deleted: boolean; hidden: boolean; title?: string | null; content?: string | null }
  authorSanctionCount: number
  actions: { id: number; action: string; memo: string; adminId?: number | null; createdAt: string }[]
}

export async function getCommunityReports(params: { status?: string; page?: number; size?: number } = {}) {
  const { data } = await client.get<Page<ReportSummaryDto>>('/api/admin/community/reports', { params })
  return data
}

export async function getCommunityReport(reportId: number) {
  const { data } = await client.get<ReportDetailDto>(`/api/admin/community/reports/${reportId}`)
  return data
}

export async function moderateCommunityReport(reportId: number, request: { action: string; memo?: string | null; days?: number | null }) {
  const { data } = await client.post<ReportDetailDto>(`/api/admin/community/reports/${reportId}/actions`, request)
  return data
}
