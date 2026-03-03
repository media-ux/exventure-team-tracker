// src/components/TaskListSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { theme } from '../lib/theme';

interface TaskListSkeletonProps {
  count?: number;
}

export function TaskListSkeleton({ count = 5 }: TaskListSkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array(count).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '16px',
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            backgroundColor: theme.bgSurface,
          }}
        >
          <Skeleton height={24} width="60%" baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Skeleton height={16} width={120} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
            <Skeleton height={16} width={80} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
          </div>
          <Skeleton height={40} style={{ marginTop: '12px' }} baseColor={theme.bgElevated} highlightColor={theme.bgSurfaceHover} />
        </div>
      ))}
    </div>
  );
}
