import Avatar from '../common/Avatar'
import Button from '../common/Button'

interface ProfileCardProps {
  name: string
  department: string
  cohort: string
  email: string
  onEdit?: () => void
}

/** 내 프로필 카드 (Profile/Profile Card) */
export function ProfileCard({ name, department, cohort, email, onEdit }: ProfileCardProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0">
          <p className="text-body-strong">{name}</p>
          <p className="text-caption text-text-secondary">
            {department} · {cohort}
          </p>
          <p className="truncate text-[11px] text-text-tertiary">{email}</p>
        </div>
      </div>
      {onEdit && (
        <Button
          size="sm"
          variant="secondary"
          className="mt-md w-full border-border-subtle text-text-brand!"
          onClick={onEdit}
        >
          프로필 수정
        </Button>
      )}
    </section>
  )
}

interface ProfileStatsProps {
  stats: { label: string; value: number }[]
}

/** 활동 숫자 카드 — 작성글 · 댓글 · 대화 (Profile/Stats) */
export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <dl className="space-y-sm rounded-lg border border-border-subtle bg-bg-surface px-lg py-md shadow-cloud-sm">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center justify-between">
          <dt className="text-caption text-text-secondary">{stat.label}</dt>
          <dd className="text-heading tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
