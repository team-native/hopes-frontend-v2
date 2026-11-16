import { createContext } from 'react'
import type { Profile } from '../types/profile'

export type ProfileContextValue = {
  profile: Profile
  updateProfile: (changes: Partial<Profile>) => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
