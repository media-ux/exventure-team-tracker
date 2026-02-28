import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TeamMembers } from './pages/TeamMembers'
import { Projects } from './pages/Projects'
import { TaskBoard } from './pages/TaskBoard'

function App() {
  const { session, loading } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  // Listen for path changes
  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePathChange)
    return () => window.removeEventListener('popstate', handlePathChange)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

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
          onClick={() => navigate('/')}
          style={{
            background: currentPath === '/' ? '#1565c0' : 'transparent',
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
          onClick={() => navigate('/tasks')}
          style={{
            background: currentPath === '/tasks' ? '#1565c0' : 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Task Board
        </button>
        <button
          onClick={() => navigate('/projects')}
          style={{
            background: currentPath === '/projects' ? '#1565c0' : 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Projects
        </button>
        <button
          onClick={() => navigate('/team')}
          style={{
            background: currentPath === '/team' ? '#1565c0' : 'transparent',
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

      {currentPath === '/' && <Dashboard />}
      {currentPath === '/tasks' && <TaskBoard />}
      {currentPath === '/projects' && <Projects />}
      {currentPath === '/team' && <TeamMembers />}
    </div>
  )
}

export default App
