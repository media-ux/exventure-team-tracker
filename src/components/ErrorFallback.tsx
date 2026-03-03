// src/components/ErrorFallback.tsx
import type { FallbackProps } from 'react-error-boundary';
import { theme } from '../lib/theme';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      style={{
        padding: '32px',
        backgroundColor: theme.errorBg,
        border: `1px solid ${theme.error}33`,
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '40px auto'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: `${theme.error}22`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}
      >
        <span style={{ fontSize: '24px', color: theme.error }}>!</span>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: theme.error, margin: '0 0 8px' }}>
        Something went wrong
      </h2>

      <p style={{ fontSize: '14px', color: `${theme.error}cc`, margin: '0 0 16px' }}>
        {error.message || 'An unexpected error occurred'}
      </p>

      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '10px 20px',
          backgroundColor: theme.error,
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Try again
      </button>

      <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '16px' }}>
        If the problem persists, try refreshing the page.
      </p>
    </div>
  );
}
