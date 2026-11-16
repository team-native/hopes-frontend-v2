import { useContext } from 'react'
import { ProfileContext } from '../contexts/profileContext'

function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile은 ProfileProvider 안에서 사용해야 해요.')
  return context
}

export default useProfile
