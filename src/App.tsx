import './App.css'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  return <Dashboard />
}

export default App
