import client from './client'

export type CategoryDto = { id: number; name: string; description: string; sortOrder: number; isActive: boolean }
export type PreferenceDto = { departmentId?: number | null; specialtyId?: number | null; invalidSelection: boolean }
export type CategoryGroups = Record<string, CategoryDto[]>

export async function getDepartments() {
  const { data } = await client.get<CategoryGroups>('/api/departments')
  return data
}

export async function getSpecialties() {
  const { data } = await client.get<CategoryGroups>('/api/specialties')
  return data
}

export async function getChatPreferences() {
  const { data } = await client.get<PreferenceDto>('/api/chat-preferences')
  return data
}

export async function updateChatPreferences(request: Partial<PreferenceDto>) {
  const { data } = await client.patch<PreferenceDto>('/api/chat-preferences', request)
  return data
}
