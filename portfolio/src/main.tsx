import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { installDiagnostics } from './lib/diagnostics'
import './styles.css'

// never fail to a silent black screen
installDiagnostics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="Portfolio application">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
