import { useCallback, useEffect, useRef, useState } from 'react'

const TOAST_DURATION = 2200

/** 화면 아래 짧은 알림. 연달아 띄우면 마지막 알림 기준으로 다시 시간을 재요. */
function useToast() {
  const [message, setMessage] = useState('')
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const showToast = useCallback((text: string) => {
    window.clearTimeout(timerRef.current)
    setMessage(text)
    timerRef.current = window.setTimeout(() => setMessage(''), TOAST_DURATION)
  }, [])

  return { toast: message, showToast }
}

export default useToast
