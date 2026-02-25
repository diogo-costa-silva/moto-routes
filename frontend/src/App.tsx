import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { JourneysPage } from './pages/JourneysPage'
import { RoutesPage } from './pages/RoutesPage'
import { DestinationsPage } from './pages/DestinationsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/routes" replace />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:slug" element={<RoutesPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/:slug" element={<JourneysPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:slug" element={<DestinationsPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
