import { Route, Routes } from 'react-router-dom'
import DevComponentsPage from './pages/DevComponents'
import FindPasswordPage from './pages/FindPassword'
import LoginPage from './pages/Login'
import MainPage from './pages/MainPage'
import SignupPage from './pages/Signup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      {/* 부품 미리보기: 개발 서버(npm run dev)에서만 열려요 */}
      {import.meta.env.DEV && <Route path="/dev/components" element={<DevComponentsPage />} />}
    </Routes>
  )
}

export default App
