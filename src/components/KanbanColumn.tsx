// src/components/KanbanColumn.tsx
import { Droppable } from '@hello-pangea/dnd';
import { DraggableTaskCard } from './DraggableTaskCard';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';
import { theme } from '../lib/theme';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  color: string;
  tasks: TaskWithRelations[];
}

export function KanbanColumn({ columnId, title, color, tasks }: KanbanColumnProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          padding: '0 4px'
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            backgroundColor: color
          }}
        />
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            margin: 0,
            color: theme.text
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: theme.textMuted,
            backgroundColor: theme.bgElevated,
            padding: '2px 8px',
            borderRadius: '9999px'
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: snapshot.isDraggingOver ? theme.cyanBg : theme.bgSurface,
              borderRadius: '8px',
              minHeight: '400px',
              border: snapshot.isDraggingOver ? `2px dashed ${theme.cyan}` : `2px solid transparent`,
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: theme.textMuted,
                  fontSize: '13px'
                }}
              >
                No tasks
              </div>
            )}

            {tasks.map((task, index) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                index={index}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
