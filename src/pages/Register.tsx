import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { theme } from '../lib/theme'

interface AvailableTeamMember {
  id: string
  name: string
  role: string
}

interface RegisterProps {
  onNavigate: (path: string) => void
}

export function Register({ onNavigate }: RegisterProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [teamMembers, setTeamMembers] = useState<AvailableTeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch team members that don't have an account yet
  useEffect(() => {
    async function fetchAvailableMembers() {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('id, name, role')
        .is('user_id', null)
        .order('name')

      if (!fetchError && data) {
        setTeamMembers(data as AvailableTeamMember[])
      }
      setLoadingMembers(false)
    }
    fetchAvailableMembers()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!selectedMemberId) {
      setError('Please select your name from the team list')
      setLoading(false)
      return
    }

    // 1. Create the auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Link the auth account to the team member
    if (signUpData.user) {
      supabase
        .from('team_members')
        .update({ user_id: signUpData.user.id })
        .eq('id', selectedMemberId)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Error linking team member:', updateError)
        })
    }

    // If email confirmation is required, show success message
    if (!signUpData.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // Otherwise, onAuthStateChange will navigate to dashboard
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        padding: '20px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ color: theme.green, marginBottom: '8px' }}>EX-VENTURE</h1>
          <div style={{
            backgroundColor: theme.bgSurface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
          }}>
            <h2 style={{ color: theme.success, marginTop: 0, fontSize: '20px' }}>Check Your Email</h2>
            <p style={{ color: theme.textSecondary, lineHeight: 1.6 }}>
              We sent a confirmation link to <strong style={{ color: theme.text }}>{email}</strong>.
              Click the link to activate your account.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: theme.cyan,
                border: `1px solid ${theme.cyan}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '12px',
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: theme.green, textAlign: 'center', marginBottom: '8px' }}>EX-VENTURE</h1>
        <p style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: '32px' }}>Create your account</p>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: theme.bgSurface,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
        }}>
          <div>
            <label htmlFor="member" style={{ display: 'block', marginBottom: '5px', color: theme.textSecondary }}>
              Your Name
            </label>
            <select
              id="member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              disabled={loading || loadingMembers}
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            >
              <option value="">
                {loadingMembers ? 'Loading team members...' : 'Select your name...'}
              </option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', color: theme.textSecondary }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: theme.textSecondary }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            />
            <span style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>
              Minimum 6 characters
            </span>
          </div>

          {error && (
            <div style={{ color: theme.error, padding: '10px', backgroundColor: theme.errorBg, borderRadius: '4px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              fontSize: '16px',
              backgroundColor: theme.green,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 600,
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', margin: '8px 0 0', color: theme.textSecondary, fontSize: '14px' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: theme.cyan,
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
