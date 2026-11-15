import { Route, Routes } from 'react-router-dom'
import FindPasswordPage from './pages/FindPassword'
import CommunityPage from './pages/Community'
import HistoryPage from './pages/History'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import MyPage from './pages/MyPage'
import SettingsPage from './pages/Settings'
import SignupPage from './pages/Signup'
import SystemErrorPage from './pages/SystemError'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/my-page" element={<MyPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/errors/:code" element={<SystemErrorPage />} />
      <Route path="*" element={<SystemErrorPage defaultCode="404" />} />
    </Routes>
  )
}

export default App
