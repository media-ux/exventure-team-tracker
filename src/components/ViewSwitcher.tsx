// src/components/ViewSwitcher.tsx

export type ViewMode = 'list' | 'board';

interface ViewSwitcherProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ mode, onModeChange }: ViewSwitcherProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}
    >
      <button
        onClick={() => onModeChange('list')}
        style={{
          padding: '8px 16px',
          border: 'none',
          backgroundColor: mode === 'list' ? '#3b82f6' : '#fff',
          color: mode === 'list' ? '#fff' : '#374151',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s, color 0.2s'
        }}
      >
        {/* List icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2" rx="1" />
          <rect x="1" y="7" width="14" height="2" rx="1" />
          <rect x="1" y="12" width="14" height="2" rx="1" />
        </svg>
        List
      </button>

      <button
        onClick={() => onModeChange('board')}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderLeft: '1px solid #e5e7eb',
          backgroundColor: mode === 'board' ? '#3b82f6' : '#fff',
          color: mode === 'board' ? '#fff' : '#374151',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background-color 0.2s, color 0.2s'
        }}
      >
        {/* Board/Kanban icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="4" height="14" rx="1" />
          <rect x="6" y="1" width="4" height="10" rx="1" />
          <rect x="11" y="1" width="4" height="6" rx="1" />
        </svg>
        Board
      </button>
    </div>
  );
}
