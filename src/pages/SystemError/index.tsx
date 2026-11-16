import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LogoMark from '../../components/common/LogoMark'
import { ROUTES } from '../../constants/routes'

type ErrorCode = '404' | '500' | 'offline' | 'session-expired'

const errorContent: Record<
  Exclude<ErrorCode, 'session-expired'>,
  { title: string; description: string; action: string }
> = {
  '404': { title: '페이지를 찾을 수 없어요', description: '주소가 바뀌었거나 삭제된 페이지예요.', action: '홈으로' },
  '500': {
    title: '잠시 문제가 생겼어요',
    description: '곧 해결할게요. 잠시 후 다시 시도해 주세요.',
    action: '다시 시도',
  },
  offline: {
    title: '인터넷에 연결되어 있지 않아요',
    description: '연결을 확인한 뒤 다시 시도해 주세요.',
    action: '다시 시도',
  },
}

function SystemErrorPage({ defaultCode }: { defaultCode?: '404' }) {
  const navigate = useNavigate()
  const { code } = useParams()
  const currentCode: ErrorCode =
    code === '500' || code === 'offline' || code === 'session-expired' ? code : (defaultCode ?? '404')

  if (currentCode === 'session-expired') {
    return (
      <main className="min-h-screen bg-bg-canvas">
        <ConfirmDialog
          open
          title="다시 로그인해 주세요"
          description="보안을 위해 로그인이 만료됐어요."
          cancelText="닫기"
          confirmText="로그인"
          onCancel={() => navigate(-1)}
          onConfirm={() => navigate(ROUTES.login)}
        />
      </main>
    )
  }

  const content = errorContent[currentCode]
  const numericCode = currentCode === 'offline' ? undefined : currentCode

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas px-5 text-center">
      <LogoMark size={48} />
      {numericCode && <p className="mt-xl text-[64px] leading-none font-semibold text-text-brand">{numericCode}</p>}
      <h1 className={`${numericCode ? 'mt-md' : 'mt-xl'} text-title`}>{content.title}</h1>
      <p className="mt-sm text-label text-text-secondary">{content.description}</p>
      <div className="mt-xl flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
          이전으로
        </Button>
        <Button size="sm" onClick={() => (currentCode === '404' ? navigate(ROUTES.home) : window.location.reload())}>
          {content.action}
        </Button>
      </div>
    </main>
  )
}

export default SystemErrorPage
