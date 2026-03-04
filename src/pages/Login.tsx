import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { theme } from '../lib/theme'

export function Login({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success - auth state change will trigger navigation
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
        <p style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: '32px' }}>Sign in to your account</p>

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
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            />
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', margin: '8px 0 0', color: theme.textSecondary, fontSize: '14px' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
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
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
