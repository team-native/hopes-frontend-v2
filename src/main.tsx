import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ConversationProvider } from './contexts/ConversationProvider'
import { ProfileProvider } from './contexts/ProfileProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <ConversationProvider>
          <App />
        </ConversationProvider>
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)
