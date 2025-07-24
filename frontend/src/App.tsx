import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Trading from './pages/Trading'
import Portfolio from './pages/Portfolio'
import Admin from './pages/Admin'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/portfolio" element={<Portfolio />} />
        {user?.role === 'admin' && (
          <Route path="/admin" element={<Admin />} />
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App