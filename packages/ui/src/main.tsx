import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './index.css'
import AppRouter from './routes/AppRouter'
import { OperatorProvider } from './context/OperatorContext'
import { parsePathRoute, ParsedRoute } from './routes/routeConfig'

function RootRouter() {
  const [route, setRoute] = useState<ParsedRoute>(() => parsePathRoute(window.location.pathname))

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState({}, '', '/dashboard')
    }

    const syncRoute = () => setRoute(parsePathRoute(window.location.pathname))
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  return <AppRouter route={route} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OperatorProvider>
      <RootRouter />
    </OperatorProvider>
  </StrictMode>,
)
