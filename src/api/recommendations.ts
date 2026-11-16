import client from './client'

export type ConsentDto = { enabled: boolean; policyVersion: string; updatedAt?: string | null }
export type RecommendationDto = { id: number; content: string; departmentId?: number | null; specialtyId?: number | null }
export type RecommendationResult = {
  items: RecommendationDto[]
  source: string
  fallbackUsed: boolean
  nextRefreshToken: string
}

export async function getRecommendationConsent() {
  const { data } = await client.get<ConsentDto>('/api/privacy/recommendation-consent')
  return data
}

export async function setRecommendationConsent(enabled: boolean, policyVersion: string) {
  const { data } = await client.put<ConsentDto>('/api/privacy/recommendation-consent', { enabled, policyVersion })
  return data
}

export async function getRecommendations(params: {
  departmentId?: number
  specialtyId?: number
  limit?: number
  refreshToken?: string
  excludeIds?: number[]
  personalized?: boolean
} = {}) {
  const { data } = await client.get<RecommendationResult>('/api/question-recommendations', {
    params,
    paramsSerializer: { indexes: null },
  })
  return data
}
