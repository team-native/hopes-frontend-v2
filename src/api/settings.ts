import client from './client'

export type AccountSetting = {
  username: string
  email: string
  nickname: string
  profileInfo: string
  profileImage?: string | null
  gender?: string | null
  major?: string | null
  cohort?: number | null
}

export type SettingMainResponse = {
  accountSetting: AccountSetting
  theme: 'DARK' | 'LIGHT'
  customPrompt: string
  logout: boolean
  inquiry: boolean
}

export async function getSettings() {
  const { data } = await client.get<SettingMainResponse>('/api/setting/main')
  return data
}

export async function updateSettings(request: { customPrompt?: string | null; deleteAllChats: boolean }) {
  const { data } = await client.patch<SettingMainResponse>('/api/setting', request)
  return data
}

export async function updateTheme(theme: 'DARK' | 'LIGHT') {
  const { data } = await client.patch<{ theme: 'DARK' | 'LIGHT' }>('/api/general', { theme })
  return data
}

export async function sendInquiry(content: string) {
  await client.post('/api/setting/inquiry', { content })
}
