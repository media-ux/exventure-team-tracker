// src/components/BoardView.tsx
import { useMemo, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { BoardSkeleton } from './BoardSkeleton';
import type { TaskWithRelations } from '../hooks/useFilteredTasks';
import type { Database } from '../lib/database.types';
import { theme } from '../lib/theme';

type TaskStatus = Database['public']['Enums']['task_status'];

const STATUS_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: theme.textMuted },
  { id: 'in_progress', title: 'In Progress', color: theme.info },
  { id: 'blocked', title: 'Blocked', color: theme.error },
  { id: 'done', title: 'Done', color: theme.green }
];

interface BoardViewProps {
  tasks: TaskWithRelations[];
  isLoading: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export function BoardView({ tasks, isLoading, onStatusChange }: BoardViewProps) {
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

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) return;

    const taskId = result.draggableId.replace('task-', '');
    const newStatus = result.destination.droppableId as TaskStatus;
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
