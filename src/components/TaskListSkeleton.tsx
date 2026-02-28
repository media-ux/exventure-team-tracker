// src/components/TaskListSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}
        >
          {/* Title */}
          <Skeleton height={24} width="60%" />
          {/* Assignee + Due date */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Skeleton height={16} width={120} />
            <Skeleton height={16} width={80} />
          </div>
          {/* Description */}
          <Skeleton height={40} style={{ marginTop: '12px' }} />
          {/* Status + Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Skeleton height={28} width={100} />
            <Skeleton height={28} width={60} />
          </div>
        </div>
      ))}
    </div>
  );
}
