// src/components/BoardView.tsx
import { useMemo, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { BoardSkeleton } from './BoardSkeleton';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';
import type { Database } from '../lib/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];

// Status column configuration
const STATUS_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'blocked', title: 'Blocked', color: '#ef4444' },
  { id: 'done', title: 'Done', color: '#10b981' }
];

interface BoardViewProps {
  tasks: TaskWithRelations[];
  isLoading: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export function BoardView({ tasks, isLoading, onStatusChange }: BoardViewProps) {
  // Group tasks by status (memoized for performance - per research Pattern 4)
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      backlog: [],
      in_progress: [],
      blocked: [],
      done: []
    };

    tasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Handle drag end - extract task ID and new status
  const handleDragEnd = useCallback(async (result: DropResult) => {
    // Dropped outside valid droppable
    if (!result.destination) {
      return;
    }

    // Dropped in same position
    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) {
      return;
    }

    // Extract task ID (strip "task-" prefix)
    const taskId = result.draggableId.replace('task-', '');
    const newStatus = result.destination.droppableId as TaskStatus;

    // Call parent handler for status update
    // Optimistic UI update happens via real-time subscription in parent
    await onStatusChange(taskId, newStatus);
  }, [onStatusChange]);

  if (isLoading) {
    return <BoardSkeleton cardsPerColumn={3} />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '16px'
        }}
      >
        {STATUS_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            columnId={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id]}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
