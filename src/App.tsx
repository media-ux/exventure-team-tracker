import './App.css'
import { useAuth } from './hooks/useAuth'
import { useTeamMembers } from './hooks/useTeamMembers'

function App() {
  const { session, user, loading } = useAuth()
  const { teamMembers, loading: teamMembersLoading } = useTeamMembers()

  console.log({ session, user, loading })
  console.log({ teamMembers, teamMembersLoading })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <h1>Ex-Venture Team Tracker</h1>
      <div className="card">
        <p>Session: {session ? 'Authenticated' : 'Not authenticated'}</p>
        <p>User: {user?.email || 'None'}</p>
      </div>
    </>
  )
}

export default App
