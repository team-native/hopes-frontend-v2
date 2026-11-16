interface ToastProps {
  /** 빈 문자열이면 그리지 않아요 */
  message: string
}

/** 화면 아래 가운데 어두운 알림 (useToast와 함께 사용) */
function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full bg-bg-inverse px-4 py-2.5 text-caption text-text-on-brand shadow-cloud-md"
    >
      {message}
    </div>
  )
}

export default Toast
