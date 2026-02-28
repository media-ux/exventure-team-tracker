// src/components/ErrorFallback.tsx
import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      style={{
        padding: '32px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
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
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}
      >
        <span style={{ fontSize: '24px' }}>!</span>
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#991b1b',
          margin: '0 0 8px'
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          fontSize: '14px',
          color: '#b91c1c',
          margin: '0 0 16px'
        }}
      >
        {error.message || 'An unexpected error occurred'}
      </p>

      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#b91c1c';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
        }}
      >
        Try again
      </button>

      <p
        style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '16px'
        }}
      >
        If the problem persists, try refreshing the page.
      </p>
    </div>
  );
}
