import { useEffect, useRef } from 'react'

/**
 * 열린 메뉴 · 팝오버를 바깥 클릭이나 Esc 키로 닫아요.
 * 돌려준 ref를 메뉴와 여는 버튼을 함께 감싸는 요소에 달아 주세요. (여는 버튼을 눌렀을 때 바로 다시 열리지 않게)
 */
function useDismiss<T extends HTMLElement>(open: boolean, onDismiss: () => void) {
  const ref = useRef<T>(null)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onDismissRef.current()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismissRef.current()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return ref
}

export default useDismiss
