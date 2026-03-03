// src/components/BoardSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { theme } from '../lib/theme';

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
          <div style={{ marginBottom: '12px' }}>
            <Skeleton height={24} width={100} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
          </div>
          <div
            style={{
              backgroundColor: theme.bgSurface,
              borderRadius: '8px',
              padding: '12px',
              minHeight: '400px'
            }}
          >
            {Array(cardsPerColumn).fill(0).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: theme.bgElevated,
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                }}
              >
                <Skeleton height={20} width="80%" baseColor={theme.bgSurfaceHover} highlightColor={theme.border} />
                <Skeleton height={14} width="50%" style={{ marginTop: '8px' }} baseColor={theme.bgSurfaceHover} highlightColor={theme.border} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
