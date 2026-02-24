import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { HomePage } from './pages/HomePage'
import { RoutesPage } from './pages/RoutesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/routes" element={<RoutesPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
