import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/AppShell/AppLayout'
import { RoutesSection } from './sections/RoutesSection'
import { JourneysSection } from './sections/JourneysSection'
import { DestinationsSection } from './sections/DestinationsSection'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/routes" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/routes" element={<RoutesSection />} />
            <Route path="/routes/:slug" element={<RoutesSection />} />
            <Route path="/journeys" element={<JourneysSection />} />
            <Route path="/journeys/:slug" element={<JourneysSection />} />
            <Route path="/destinations" element={<DestinationsSection />} />
            <Route path="/destinations/:slug" element={<DestinationsSection />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
