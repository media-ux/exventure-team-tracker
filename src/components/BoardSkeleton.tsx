// src/components/BoardSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface BoardSkeletonProps {
  cardsPerColumn?: number;
}

export function BoardSkeleton({ cardsPerColumn = 3 }: BoardSkeletonProps) {
  const columns = ['Backlog', 'In Progress', 'Blocked', 'Done'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}
    >
      {columns.map((columnName) => (
        <div key={columnName}>
          {/* Column header */}
          <div style={{ marginBottom: '12px' }}>
            <Skeleton height={24} width={100} />
          </div>
          {/* Column content */}
          <div
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              minHeight: '400px'
            }}
          >
            {Array(cardsPerColumn).fill(0).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <Skeleton height={20} width="80%" />
                <Skeleton height={14} width="50%" style={{ marginTop: '8px' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
