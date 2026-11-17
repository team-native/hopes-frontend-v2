import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getToken } from './utils/token'
import { ROUTES } from './constants/routes'
import DevComponentsPage from './pages/DevComponents'
import CommunityPage from './pages/Community'
import CampusPage from './pages/Campus'
import AdminReportsPage from './pages/AdminReports'
import FindPasswordPage from './pages/FindPassword'
import HistoryPage from './pages/History'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import MyPage from './pages/MyPage'
import SettingsPage from './pages/Settings'
import SignupPage from './pages/Signup'
import SystemErrorPage from './pages/SystemError'

function ProtectedRoutes() {
  const location = useLocation()
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()))

  useEffect(() => {
    const update = () => setAuthenticated(Boolean(getToken()))
    window.addEventListener('hopes:authenticated', update)
    window.addEventListener('hopes:logged-out', update)
    return () => {
      window.removeEventListener('hopes:authenticated', update)
      window.removeEventListener('hopes:logged-out', update)
    }
  }, [])

  return authenticated ? <Outlet /> : <Navigate to={ROUTES.login} replace state={{ from: location }} />
}

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.chat} element={<HomePage />} />
        <Route path={ROUTES.chatDetail(':conversationId')} element={<HomePage />} />
        <Route path={ROUTES.community} element={<CommunityPage />} />
        <Route path={ROUTES.history} element={<HistoryPage />} />
        <Route path={ROUTES.myPage} element={<MyPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path={ROUTES.campus} element={<CampusPage />} />
        <Route path="/admin/community/reports" element={<AdminReportsPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      {/* 부품 미리보기: 개발 서버(npm run dev)에서만 열려요 */}
      {import.meta.env.DEV && <Route path="/dev/components" element={<DevComponentsPage />} />}
      <Route path="/errors/:code" element={<SystemErrorPage />} />
      <Route path="*" element={<SystemErrorPage defaultCode="404" />} />
    </Routes>
  )
}

export default App
