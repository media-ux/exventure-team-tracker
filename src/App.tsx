import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TeamMembers } from './pages/TeamMembers'
import { Projects } from './pages/Projects'
import { TaskBoard } from './pages/TaskBoard'
import { Spiderweb } from './pages/Spiderweb'
import { Settings } from './pages/Settings'
import { theme } from './lib/theme'

function App() {
  const { session, loading } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)

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
    setMenuOpen(false)
  }

  if (loading) {
    return <div style={{ color: theme.text, padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  const navBtn = (path: string): React.CSSProperties => ({
    background: currentPath === path ? theme.navActive : 'transparent',
    color: currentPath === path ? theme.cyan : theme.textSecondary,
    border: currentPath === path ? `1px solid ${theme.cyan}` : '1px solid transparent',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  })

  return (
    <div>
      <nav style={{
        background: theme.navBg,
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            color: theme.green,
            fontWeight: 700,
            fontSize: '16px',
            letterSpacing: '0.5px',
          }}>
            EX-VENTURE
          </span>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`} style={{ marginTop: '8px' }}>
          <button onClick={() => navigate('/')} style={navBtn('/')}>Dashboard</button>
          <button onClick={() => navigate('/tasks')} style={navBtn('/tasks')}>Task Board</button>
          <button onClick={() => navigate('/projects')} style={navBtn('/projects')}>Projects</button>
          <button onClick={() => navigate('/team')} style={navBtn('/team')}>Team</button>
          <button onClick={() => navigate('/spiderweb')} style={navBtn('/spiderweb')}>Spiderweb</button>
          <button onClick={() => navigate('/settings')} style={navBtn('/settings')}>Settings</button>
        </div>
      </nav>

      {currentPath === '/' && <Dashboard />}
      {currentPath === '/tasks' && <TaskBoard />}
      {currentPath === '/projects' && <Projects />}
      {currentPath === '/team' && <TeamMembers />}
      {currentPath === '/spiderweb' && <Spiderweb />}
      {currentPath === '/settings' && <Settings />}
    </div>
  )
}

export default App
