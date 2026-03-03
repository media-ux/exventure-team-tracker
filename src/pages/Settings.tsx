import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { theme } from '../lib/theme'

export function Settings() {
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const sendTestNotification = async () => {
    setTestStatus('sending')
    setTestMessage('')

    try {
      const { data, error } = await supabase.functions.invoke('slack-notify', {
        body: {
          type: 'INSERT',
          record: {
            id: 'test-' + Date.now(),
            title: 'Test Notification from Settings',
            description: null,
            status: 'backlog',
            assigned_to: null,
            sub_unit_id: 'test',
            created_by: 'test',
            due_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          old_record: null,
        },
      })

      if (error) throw error

      if (data?.success) {
        setTestStatus('success')
        setTestMessage('Test notification sent! Check your Slack channel.')
      } else if (data?.skipped) {
        setTestStatus('success')
        setTestMessage('Function responded but skipped notification: ' + data.reason)
      } else {
        setTestStatus('error')
        setTestMessage('Unexpected response: ' + JSON.stringify(data))
      }
    } catch (err) {
      setTestStatus('error')
      const message = err instanceof Error ? err.message : 'Unknown error'
      setTestMessage('Failed to send: ' + message)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: theme.green }}>Settings</h1>

      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backgroundColor: theme.bgSurface,
      }}>
        <h2 style={{ marginTop: 0, color: theme.text }}>Slack Integration</h2>

        <p style={{ color: theme.textSecondary, lineHeight: '1.6' }}>
          When configured, the tracker automatically posts to Slack when tasks are created,
          assigned, or completed. Notifications are triggered at the database level, so they
          work regardless of how the change is made.
        </p>

        <div style={{
          background: theme.bgElevated,
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: `1px solid ${theme.border}`,
        }}>
          <strong style={{ color: theme.text }}>Setup required:</strong>{' '}
          <span style={{ color: theme.textSecondary }}>
            Slack notifications require a webhook URL and secrets
            to be configured in Supabase. See the{' '}
            <a
              href="https://github.com/your-org/ex-venture-tracker/blob/main/docs/SLACK-SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.cyan }}
            >
              Slack Setup Guide
            </a>{' '}
            for step-by-step instructions.
          </span>
        </div>

        <h3 style={{ color: theme.text }}>What gets notified</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: `2px solid ${theme.border}` }}>
              <th style={{ padding: '0.5rem', color: theme.text }}>Event</th>
              <th style={{ padding: '0.5rem', color: theme.text }}>Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>Task Created</td>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>New task inserted into database</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>Task Assigned</td>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>assigned_to field changes to a team member</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>Task Completed</td>
              <td style={{ padding: '0.5rem', color: theme.textSecondary }}>Status changes to "done"</td>
            </tr>
          </tbody>
        </table>
        <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>
          Editing a task's description or other fields does <em>not</em> trigger a notification.
        </p>

        <h3 style={{ color: theme.text }}>Test Notification</h3>
        <p style={{ color: theme.textSecondary }}>
          Send a test notification to verify your Slack webhook is working.
        </p>
        <button
          onClick={sendTestNotification}
          disabled={testStatus === 'sending'}
          style={{
            background: testStatus === 'sending' ? theme.bgElevated : theme.cyan,
            color: 'white',
            border: 'none',
            padding: '0.5rem 1.5rem',
            borderRadius: '6px',
            cursor: testStatus === 'sending' ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {testStatus === 'sending' ? 'Sending...' : 'Send Test Notification'}
        </button>

        {testMessage && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: '6px',
            background: testStatus === 'success' ? theme.successBg : theme.errorBg,
            color: testStatus === 'success' ? theme.success : theme.error,
            border: `1px solid ${testStatus === 'success' ? theme.success : theme.error}`,
          }}>
            {testMessage}
          </div>
        )}
      </div>
    </div>
  )
}
