import { useEffect, useState, type ReactNode } from 'react'
import client from '../api/client'
import { mockProfile } from '../mocks/profile'
import type { Profile } from '../types/profile'
import { ProfileContext } from './profileContext'

type UserResponse = {
  username: string
  email: string
  nickname: string
  profileInfo: string
  major?: string | null
  cohort?: number | null
}

function toProfile(user: UserResponse): Profile {
  return {
    id: user.username,
    name: user.nickname || user.username,
    bio: user.profileInfo ?? '',
    department: user.major ?? '',
    generation: user.cohort ? `${user.cohort}기` : '',
    email: user.email,
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(mockProfile)

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      const token = localStorage.getItem('hopes:access-token') ?? sessionStorage.getItem('hopes:access-token')
      if (!token) return
      try {
        const { data } = await client.get<UserResponse>('/api/mypage')
        if (active) setProfile(toProfile(data))
      } catch {
        // The current screen can still render while the session is unavailable.
      }
    }
    const onLogout = () => {
      if (active) setProfile(mockProfile)
    }
    window.addEventListener('hopes:authenticated', loadProfile)
    window.addEventListener('hopes:logged-out', onLogout)
    void loadProfile()
    return () => {
      active = false
      window.removeEventListener('hopes:authenticated', loadProfile)
      window.removeEventListener('hopes:logged-out', onLogout)
    }
  }, [])

  async function updateProfile(changes: Partial<Profile>) {
    const { data } = await client.patch<UserResponse>('/api/mypage', {
      nickname: changes.name,
      profileInfo: changes.bio,
    })
    setProfile(toProfile(data))
  }

  return <ProfileContext.Provider value={{ profile, updateProfile }}>{children}</ProfileContext.Provider>
}
