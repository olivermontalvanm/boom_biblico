import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperatorPage } from './pages/OperatorPage'
import { DisplayPage } from './pages/DisplayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<Navigate to="/operator" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
