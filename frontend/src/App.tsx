import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { HomePage } from './pages/HomePage'
import { JourneysPage } from './pages/JourneysPage'
import { RoutesPage } from './pages/RoutesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
