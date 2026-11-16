import { useEffect, useState } from 'react'
import { getCommunityReport, getCommunityReports, moderateCommunityReport, type ReportDetailDto, type ReportSummaryDto } from '../../api/moderation'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import TextArea from '../../components/common/TextArea'
import TextField from '../../components/common/TextField'
import Toast from '../../components/common/Toast'
import { EmptyState, InlineError } from '../../components/feedback/Feedback'
import AppLayout from '../../components/layout/AppLayout'
import SectionHeader from '../../components/layout/SectionHeader'
import useToast from '../../hooks/useToast'

const STATUSES = ['전체', 'RECEIVED', 'RESOLVED', 'DISMISSED']
const ACTIONS = ['HIDE', 'RESTORE', 'WARN', 'SUSPEND', 'RESOLVE', 'DISMISS', 'REOPEN']

function AdminReportsPage() {
  const { toast, showToast } = useToast()
  const [reports, setReports] = useState<ReportSummaryDto[]>([])
  const [status, setStatus] = useState('전체')
  const [selectedReport, setSelectedReport] = useState<ReportDetailDto | null>(null)
  const [action, setAction] = useState(ACTIONS[0])
  const [memo, setMemo] = useState('')
  const [days, setDays] = useState('')
  const [error, setError] = useState(false)

  async function loadReports() {
    try {
      const page = await getCommunityReports({ status: status === '전체' ? undefined : status, page: 0, size: 50 })
      setReports(page.items)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [status])

  async function openReport(reportId: number) {
    try {
      setSelectedReport(await getCommunityReport(reportId))
    } catch {
      showToast('신고 상세를 불러오지 못했어요.')
    }
  }

  async function submitAction() {
    if (!selectedReport) return
    try {
      const detail = await moderateCommunityReport(selectedReport.id, {
        action,
        memo: memo.trim() || undefined,
        days: days ? Number(days) : undefined,
      })
      setSelectedReport(detail)
      setMemo('')
      await loadReports()
      showToast('신고 조치를 저장했어요')
    } catch {
      showToast('신고 조치를 저장하지 못했어요. 권한과 입력값을 확인해 주세요.')
    }
  }

  return (
    <AppLayout activeMenu={null}>
      <main className="mx-auto w-full max-w-[1100px] space-y-lg px-5 py-5 md:px-8 md:py-6">
        <header>
          <h1 className="text-title">커뮤니티 신고 관리</h1>
          <p className="mt-1 text-caption text-text-secondary">운영자 권한이 필요해요.</p>
        </header>
        <div className="grid gap-lg lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <section className="space-y-sm">
            <div className="flex items-center justify-between">
              <SectionHeader title="신고 목록" />
              <Select label="상태" placeholder="상태 선택" options={STATUSES} value={status} onChange={setStatus} variant="compact" />
            </div>
            {error ? (
              <InlineError title="신고 목록을 불러오지 못했어요" description="운영자 권한이 있거나 서버가 연결되어 있는지 확인해 주세요." onRetry={() => void loadReports()} />
            ) : reports.length ? (
              <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-surface px-md shadow-cloud-sm">
                {reports.map((report) => (
                  <li key={report.id}>
                    <button type="button" onClick={() => void openReport(report.id)} className="flex w-full items-center justify-between gap-md py-md text-left hover:bg-bg-canvas">
                      <span>
                        <span className="block text-label-strong">{report.targetType} #{report.targetId} · {report.reasonCode}</span>
                        <span className="text-caption text-text-secondary">{new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                      </span>
                      <span className="text-caption">{report.status} · {report.sameTargetReportCount}건</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="처리할 신고가 없어요" />
            )}
          </section>
          <section className="space-y-sm">
            <SectionHeader title="신고 상세 및 조치" />
            {selectedReport ? (
              <div className="space-y-md rounded-lg border border-border-subtle bg-bg-surface p-md shadow-cloud-sm">
                <dl className="grid grid-cols-2 gap-sm text-caption">
                  <div><dt className="text-text-secondary">신고 사유</dt><dd>{selectedReport.reasonCode}</dd></div>
                  <div><dt className="text-text-secondary">상태</dt><dd>{selectedReport.status}</dd></div>
                  <div><dt className="text-text-secondary">같은 대상 신고</dt><dd>{selectedReport.sameTargetReportCount}</dd></div>
                  <div><dt className="text-text-secondary">작성자 제재 횟수</dt><dd>{selectedReport.authorSanctionCount}</dd></div>
                </dl>
                <p className="whitespace-pre-wrap text-caption">{selectedReport.detail || '추가 설명이 없어요.'}</p>
                <div className="rounded-md bg-bg-canvas p-sm text-caption">
                  <p className="font-medium">현재 대상</p>
                  <p>{selectedReport.currentTarget.title ?? '제목 없음'}</p>
                  <p className="whitespace-pre-wrap">{selectedReport.currentTarget.content ?? '내용 없음'}</p>
                  <p>존재: {selectedReport.currentTarget.exists ? '예' : '아니오'} · 숨김: {selectedReport.currentTarget.hidden ? '예' : '아니오'} · 삭제: {selectedReport.currentTarget.deleted ? '예' : '아니오'}</p>
                </div>
                <div className="space-y-sm">
                  <Select label="조치" placeholder="조치 선택" options={ACTIONS} value={action} onChange={setAction} />
                  <TextArea label="메모" value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} />
                  <TextField label="정지 일수" type="number" value={days} onChange={(event) => setDays(event.target.value)} />
                  <Button onClick={() => void submitAction()}>조치 저장</Button>
                </div>
              </div>
            ) : (
              <EmptyState title="신고를 선택해 주세요" />
            )}
          </section>
        </div>
      </main>
      <Toast message={toast} />
    </AppLayout>
  )
}

export default AdminReportsPage
