import { useState, type ReactNode } from 'react'
import { mockProfile } from '../mocks/profile'
import type { Profile } from '../types/profile'
import { ProfileContext } from './profileContext'

// 사이드바·홈·마이페이지가 같은 프로필 상태를 보도록 앱 전역에서 관리한다.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(mockProfile)

  function updateProfile(changes: Partial<Profile>) {
    // TODO: 프로필 수정 API 연동 후 응답값으로 갱신
    setProfile((current) => ({ ...current, ...changes }))
  }

  return <ProfileContext.Provider value={{ profile, updateProfile }}>{children}</ProfileContext.Provider>
}
