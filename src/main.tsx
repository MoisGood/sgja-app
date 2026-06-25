import { createRoot } from 'react-dom/client'
import './styles/universal.css'
import './styles/skins/skin.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
