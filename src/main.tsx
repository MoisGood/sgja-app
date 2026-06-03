import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/universal.css'
import './index.css'
import App from './App.tsx'
// import { registerServiceWorker } from './utils/pwaServiceWorkerRegister'

// Registrar Service Worker para PWA
// Comentado temporalmente debido a problemas con Response.clone()
// registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
