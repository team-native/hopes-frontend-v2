import { Route, Routes } from 'react-router-dom'
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
    </Routes>
  )
}

export default App
