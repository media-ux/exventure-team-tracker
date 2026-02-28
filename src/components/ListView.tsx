// src/components/ListView.tsx
import { TaskListSkeleton } from './TaskListSkeleton';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';

interface ListViewProps {
  tasks: TaskWithRelations[];
  isLoading: boolean;
  onTaskUpdate?: () => void;
}

export function ListView({ tasks, isLoading, onTaskUpdate }: ListViewProps) {
  if (isLoading) {
    return <TaskListSkeleton count={5} />;
  }

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          <span role="img" aria-label="No tasks">📋</span>
        </div>
        <p style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>
          No tasks found
        </p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Try adjusting your filters or create a new task.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        >
          {/* Task header with project context */}
          {task.projects && (
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}
            >
              {task.projects.name} {task.sub_units && `/ ${task.sub_units.name}`}
            </div>
          )}

          {/* Task title */}
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              margin: '0 0 8px',
              color: '#111827'
            }}
          >
            {task.title}
          </h3>

          {/* Task metadata row */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}
          >
            {/* Assignee */}
            {task.team_members && (
              <span>
                {task.team_members.avatar_url && (
                  <span style={{ marginRight: '4px' }}>
                    {task.team_members.avatar_url}
                  </span>
                )}
                {task.team_members.name}
              </span>
            )}

            {/* Status */}
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: getStatusColor(task.status).bg,
                color: getStatusColor(task.status).text
              }}
            >
              {formatStatus(task.status)}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Description preview */}
          {task.description && (
            <p
              style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: '12px 0 0',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {task.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper functions
function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    done: 'Done'
  };
  return statusLabels[status] || status;
}

function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    backlog: { bg: '#f3f4f6', text: '#374151' },
    in_progress: { bg: '#dbeafe', text: '#1d4ed8' },
    blocked: { bg: '#fee2e2', text: '#dc2626' },
    done: { bg: '#d1fae5', text: '#059669' }
  };
  return colors[status] || { bg: '#f3f4f6', text: '#374151' };
}
