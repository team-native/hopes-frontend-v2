import { useNavigate, useParams } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import Icon from '../../components/common/Icon'

type ErrorCode = '404' | '500' | 'offline' | 'session-expired'

const errorContent: Record<Exclude<ErrorCode, 'session-expired'>, { title: string; description: string; action: string }> = {
  '404': { title: '페이지를 찾을 수 없어요', description: '주소가 바뀌었거나 삭제된 페이지예요.', action: '홈으로' },
  '500': { title: '잠시 문제가 생겼어요', description: '곧 해결할게요. 잠시 후 다시 시도해 주세요.', action: '다시 시도' },
  offline: { title: '인터넷에 연결되어 있지 않아요', description: '연결을 확인한 뒤 다시 시도해 주세요.', action: '다시 시도' },
}

function SystemErrorPage({ defaultCode }: { defaultCode?: '404' }) {
  const navigate = useNavigate()
  const { code } = useParams()
  const currentCode: ErrorCode = code === '500' || code === 'offline' || code === 'session-expired' ? code : defaultCode ?? '404'

  if (currentCode === 'session-expired') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] p-4">
        <div className="fixed inset-0 bg-[#161b2b]/35" />
        <section role="alertdialog" aria-modal="true" className="relative w-full max-w-[300px] rounded-[20px] bg-white p-5 text-center shadow-2xl">
          <h1 className="text-sm font-semibold">다시 로그인해 주세요</h1>
          <p className="mt-2 text-xs text-sub">보안을 위해 로그인이 만료됐어요.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => navigate(-1)} className="h-9 rounded-lg border border-line text-xs">닫기</button>
            <button onClick={() => navigate('/login')} className="h-9 rounded-lg bg-primary text-xs font-medium text-white">로그인</button>
          </div>
        </section>
      </main>
    )
  }

  const content = errorContent[currentCode]
  const numericCode = currentCode === 'offline' ? undefined : currentCode

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f8fc] px-5 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-xl border border-[#e9eef8] bg-white shadow-sm"><img src={logo} alt="hopes" className="size-8" /></span>
      {numericCode && <p className="text-6xl font-semibold leading-none text-brand">{numericCode}</p>}
      <h1 className={`${numericCode ? 'mt-4' : ''} text-xl font-bold text-ink`}>{content.title}</h1>
      <p className="mt-3 text-sm text-sub">{content.description}</p>
      <div className="mt-5 flex gap-2">
        <button onClick={() => navigate(-1)} className="h-9 rounded-lg border border-line bg-white px-4 text-xs text-brand">이전으로</button>
        <button onClick={() => currentCode === '404' ? navigate('/') : window.location.reload()} className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover">{content.action}</button>
      </div>
      {currentCode === 'offline' && <Icon name="alert" className="sr-only" />}
    </main>
  )
}

export default SystemErrorPage