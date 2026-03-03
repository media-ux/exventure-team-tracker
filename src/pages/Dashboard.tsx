import { useAuth } from '../hooks/useAuth'
import { theme } from '../lib/theme'

export function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: theme.green, marginBottom: '8px' }}>Dashboard</h1>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '18px', color: theme.text }}>Welcome {user?.email}</p>
        <p style={{ color: theme.textSecondary }}>Use the navigation above to manage your projects and team.</p>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: theme.error,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
