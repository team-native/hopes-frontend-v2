import type { ReactNode } from 'react'

export type IconName =
  | 'alert'
  | 'arrow-up'
  | 'bed'
  | 'bookmark'
  | 'chat'
  | 'chevron-down'
  | 'clock'
  | 'code'
  | 'copy'
  | 'file'
  | 'heart'
  | 'home'
  | 'history'
  | 'image'
  | 'pin'
  | 'plus'
  | 'refresh'
  | 'send'
  | 'settings'
  | 'share'
  | 'upload'
  | 'users'
  | 'bell'
  | 'x'

const paths: Record<IconName, ReactNode> = {
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4m0 4h.01" /></>,
  'arrow-up': <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>,
  bed: <><path d="M3 19V7m0 8h18v4M3 12h18v7M7 12V9h5a3 3 0 0 1 3 3" /></>,
  bookmark: <path d="M6.5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16l-5.5-4-5.5 4Z" />,
  chat: <path d="M20.5 11.5a8 8 0 0 1-8 8H5l-1.5 1.5V12a8.5 8.5 0 1 1 17 0Z" />,
  'chevron-down': <path d="m7 10 5 5 5-5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  code: <><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12" /></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></>,
  file: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
  heart: <path d="M20.5 8.8c0 5.1-8.5 10.2-8.5 10.2S3.5 13.9 3.5 8.8A4.3 4.3 0 0 1 12 6.6a4.3 4.3 0 0 1 8.5 2.2Z" />,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  history: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  plus: <><path d="M12 5v14m-7-7h14" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L4 9m0 0V5m0 4h4" /><path d="M4 13a8 8 0 0 0 14.8 4L20 15m0 0v4m0-4h-4" /></>,
  send: <><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z" /><path d="M10.1 13.9 15 9" /></>,
  settings: <><path d="M10.3 3.2a1.8 1.8 0 0 1 3.4 0l.4 1.4a7.8 7.8 0 0 1 1.7.7l1.3-.7a1.8 1.8 0 0 1 2.4 2.4l-.7 1.3c.3.5.6 1.1.7 1.7l1.4.4a1.8 1.8 0 0 1 0 3.4l-1.4.4a7.8 7.8 0 0 1-.7 1.7l.7 1.3a1.8 1.8 0 0 1-2.4 2.4l-1.3-.7c-.5.3-1.1.6-1.7.7l-.4 1.4a1.8 1.8 0 0 1-3.4 0l-.4-1.4a7.8 7.8 0 0 1-1.7-.7l-1.3.7a1.8 1.8 0 0 1-2.4-2.4l.7-1.3a7.8 7.8 0 0 1-.7-1.7l-1.4-.4a1.8 1.8 0 0 1 0-3.4l1.4-.4c.2-.6.4-1.2.7-1.7l-.7-1.3a1.8 1.8 0 0 1 2.4-2.4l1.3.7c.5-.3 1.1-.6 1.7-.7z" /><circle cx="12" cy="12" r="3" /></>,
  share: <><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z" /><path d="M10.1 13.9 15 9" /></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M5 20h14" /></>,
  users: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-17.8a4 4 0 0 1 0 7.6m2 3.2a5 5 0 0 1 3 4.6V21" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9Z" /><path d="M10 21h4" /></>,
  x: <path d="m18 6-12 12M6 6l12 12" />,
}

type IconProps = {
  name: IconName
  className?: string
}

function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'x' ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

export default Icon