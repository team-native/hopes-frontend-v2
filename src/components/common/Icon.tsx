import {
  ArrowUp,
  BedSingle,
  Bell,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleAlert,
  Clock,
  Code,
  Copy,
  Ellipsis,
  FileText,
  Flag,
  Heart,
  History,
  House,
  Image,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Share2,
  Upload,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'

export type IconName =
  | 'alert'
  | 'arrow-up'
  | 'bed'
  | 'bookmark'
  | 'chat'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'code'
  | 'copy'
  | 'file'
  | 'flag'
  | 'heart'
  | 'home'
  | 'history'
  | 'image'
  | 'info'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'more'
  | 'moon'
  | 'pin'
  | 'pencil'
  | 'plus'
  | 'refresh'
  | 'send'
  | 'search'
  | 'settings'
  | 'sliders'
  | 'share'
  | 'trash'
  | 'upload'
  | 'users'
  | 'bell'
  | 'x'

const icons: Record<Exclude<IconName, 'trash'>, LucideIcon> = {
  alert: CircleAlert,
  'arrow-up': ArrowUp,
  bed: BedSingle,
  bookmark: Bookmark,
  chat: MessageCircle,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  code: Code,
  copy: Copy,
  file: FileText,
  flag: Flag,
  heart: Heart,
  home: House,
  history: History,
  image: Image,
  info: Info,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  more: Ellipsis,
  moon: Moon,
  pin: MapPin,
  pencil: Pencil,
  plus: Plus,
  refresh: RefreshCw,
  send: Send,
  search: Search,
  settings: Settings,
  sliders: SlidersHorizontal,
  share: Share2,
  upload: Upload,
  users: UsersRound,
  bell: Bell,
  x: X,
}

type IconProps = {
  name: IconName
  className?: string
}

function Icon({ name, className = 'size-5' }: IconProps) {
  if (name === 'check') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 12.5 5.2 5.2L20 6.8" />
      </svg>
    )
  }

  if (name === 'pencil') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="rotate(45 12 12)">
          <path d="M2.5 10.5 5 8.2h13.5l3 3.8-3 3.8H5l-2.5-2.3z" />
          <path d="M5.8 8.2v7.6m12.2-7.6v7.6m-7.4-3.8h4.2" />
        </g>
      </svg>
    )
  }

  if (name === 'trash') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 7h15M9 7V4.5h6V7" />
        <path d="m6.5 7 .9 13h9.2l.9-13" />
      </svg>
    )
  }

  const LucideIcon = icons[name]

  return <LucideIcon aria-hidden="true" className={className} strokeWidth={1.8} />
}

export default Icon
