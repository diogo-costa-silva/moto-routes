import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { JourneysPage } from './pages/JourneysPage'
import { RoutesPage } from './pages/RoutesPage'
import { DestinationsPage } from './pages/DestinationsPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/routes" replace />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:slug" element={<RoutesPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/:slug" element={<JourneysPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:slug" element={<DestinationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      </ErrorBoundary>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
