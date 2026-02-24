import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}

export default App
