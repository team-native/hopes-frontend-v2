import Badge from '../common/Badge'
import Switch from '../common/Switch'

interface SettingToggleRowProps {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** 제목 옆 작은 배지 (예: "준비 중") */
  badge?: string
}

/** 설정 한 줄 — 제목 · 설명 + 오른쪽 스위치 (알림 · 화면 설정) */
function SettingToggleRow({ title, description, checked, onChange, disabled, badge }: SettingToggleRowProps) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-md py-3">
      <div>
        <h3 className="flex items-center gap-1.5 text-label-strong">
          {title}
          {badge && <Badge>{badge}</Badge>}
        </h3>
        <p className="mt-0.5 text-caption text-text-secondary">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  )
}

export default SettingToggleRow
