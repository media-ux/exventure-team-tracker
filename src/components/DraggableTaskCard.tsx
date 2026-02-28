// src/components/DraggableTaskCard.tsx
import { Draggable } from '@hello-pangea/dnd';
import { TaskWithRelations } from '../hooks/useFilteredTasks';

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
            backgroundColor: snapshot.isDragging ? '#f0f9ff' : '#fff',
            borderRadius: '6px',
            boxShadow: snapshot.isDragging
              ? '0 8px 16px rgba(0, 0, 0, 0.15)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '8px',
            border: snapshot.isDragging ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            cursor: 'grab',
            transition: 'background-color 0.2s, box-shadow 0.2s, border 0.2s'
          }}
        >
          {/* Task title */}
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 6px',
              color: '#111827'
            }}
          >
            {task.title}
          </h4>

          {/* Task metadata */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '12px',
              color: '#6b7280'
            }}
          >
            {/* Assignee avatar + name */}
            {task.team_members && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {task.team_members.avatar_url && (
                  <span>{task.team_members.avatar_url}</span>
                )}
                <span>{task.team_members.name}</span>
              </span>
            )}

            {/* Due date */}
            {task.due_date && (
              <span
                style={{
                  color: isOverdue(task.due_date) ? '#dc2626' : '#6b7280'
                }}
              >
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>

          {/* Project context */}
          {task.projects && (
            <div
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '6px'
              }}
            >
              {task.projects.code_name}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// Helper functions
function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
