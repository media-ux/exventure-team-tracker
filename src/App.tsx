import { useState } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TeamMembers } from './pages/TeamMembers'

type Page = 'dashboard' | 'team'

function App() {
  const { session, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div>
      <nav style={{
        background: '#1976d2',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setCurrentPage('dashboard')}
          style={{
            background: currentPage === 'dashboard' ? '#1565c0' : 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentPage('team')}
          style={{
            background: currentPage === 'team' ? '#1565c0' : 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Team
        </button>
      </nav>

      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'team' && <TeamMembers />}
    </div>
  )
}

export default App
