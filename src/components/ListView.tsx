// src/components/ListView.tsx
import { TaskListSkeleton } from './TaskListSkeleton';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';
import { theme } from '../lib/theme';

interface ListViewProps {
  tasks: TaskWithRelations[];
  isLoading: boolean;
  onTaskUpdate?: () => void;
}

export function ListView({ tasks, isLoading, onTaskUpdate: _onTaskUpdate }: ListViewProps) {
  if (isLoading) {
    return <TaskListSkeleton count={5} />;
  }

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: theme.bgSurface,
          borderRadius: '8px',
          color: theme.textSecondary,
          border: `1px solid ${theme.border}`,
        }}
      >
        <p style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>
          No tasks found
        </p>
        <p style={{ fontSize: '14px', marginTop: '8px', color: theme.textMuted }}>
          Try adjusting your filters or create a new task.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: '16px',
            backgroundColor: theme.bgSurface,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px'
          }}
        >
          {task.projects && (
            <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '8px' }}>
              {task.projects.name} {task.sub_units && `/ ${task.sub_units.name}`}
            </div>
          )}

          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', color: theme.text }}>
            {task.title}
          </h3>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', color: theme.textSecondary, flexWrap: 'wrap' }}>
            {task.team_members && (
              <span>{task.team_members.name}</span>
            )}

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

            {task.due_date && (
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            )}
          </div>

          {task.description && (
            <p
              style={{
                fontSize: '14px',
                color: theme.textSecondary,
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
    backlog: { bg: theme.status.backlog.bg, text: theme.status.backlog.text },
    in_progress: { bg: theme.status.in_progress.bg, text: theme.status.in_progress.text },
    blocked: { bg: theme.status.blocked.bg, text: theme.status.blocked.text },
    done: { bg: theme.status.done.bg, text: theme.status.done.text }
  };
  return colors[status] || { bg: theme.bgElevated, text: theme.textSecondary };
}
