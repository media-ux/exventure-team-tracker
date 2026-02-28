import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { projects } = useProjects()
  const { tasks } = useTasks()

  console.log({ projects, tasks })

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>Dashboard</h1>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '18px' }}>Welcome {user?.email}</p>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
