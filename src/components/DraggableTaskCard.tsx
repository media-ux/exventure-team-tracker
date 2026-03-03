// src/components/DraggableTaskCard.tsx
import { Draggable } from '@hello-pangea/dnd';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';
import { theme } from '../lib/theme';

interface DraggableTaskCardProps {
  task: TaskWithRelations;
  index: number;
}

export function DraggableTaskCard({ task, index }: DraggableTaskCardProps) {
  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            padding: '12px',
            backgroundColor: snapshot.isDragging ? theme.cyanBg : theme.bgElevated,
            borderRadius: '6px',
            boxShadow: snapshot.isDragging
              ? `0 8px 16px rgba(0, 0, 0, 0.4)`
              : '0 1px 3px rgba(0, 0, 0, 0.2)',
            marginBottom: '8px',
            border: snapshot.isDragging ? `2px solid ${theme.cyan}` : `1px solid ${theme.border}`,
            cursor: 'grab',
            transition: 'background-color 0.2s, box-shadow 0.2s, border 0.2s'
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 6px',
              color: theme.text
            }}
          >
            {task.title}
          </h4>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '12px',
              color: theme.textSecondary
            }}
          >
            {task.team_members && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{task.team_members.name}</span>
              </span>
            )}

            {task.due_date && (
              <span style={{ color: isOverdue(task.due_date) ? theme.error : theme.textSecondary }}>
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>

          {task.projects && (
            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '6px' }}>
              {task.projects.code_name}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
