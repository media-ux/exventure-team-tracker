// src/pages/TaskBoard.tsx
import { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ViewSwitcher } from '../components/ViewSwitcher';
import type { ViewMode } from '../components/ViewSwitcher';
import { TaskFilters } from '../components/TaskFilters';
import { ListView } from '../components/ListView';
import { BoardView } from '../components/BoardView';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { ErrorFallback } from '../components/ErrorFallback';
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import type { TaskFilters as TaskFiltersType, TaskWithRelations } from '../hooks/useFilteredTasks';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useTasks } from '../hooks/useTasks';
import type { Database } from '../lib/database.types';
import { theme } from '../lib/theme';

type TaskStatus = Database['public']['Enums']['task_status'];

function TaskBoardContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<TaskFiltersType>({
    projectId: null,
    assignedTo: null
  });

  const { tasks, isLoading, error, refetch } = useFilteredTasks(filters);
  const { changeStatus } = useTasks();

  const { channelState } = useRealtimeSubscription<TaskWithRelations>({
    table: 'tasks',
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
    enabled: !isLoading
  });

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await changeStatus(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
      refetch();
    }
  }, [changeStatus, refetch]);

  if (error) {
    throw error;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', color: theme.green }}>
            Task Board
          </h1>
          <p style={{ fontSize: '14px', color: theme.textSecondary, margin: 0 }}>
            View and manage tasks across all projects
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ConnectionIndicator channelState={channelState} />
          <ViewSwitcher mode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>

      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {!isLoading && (
        <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '0 0 16px' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {(filters.projectId || filters.assignedTo) && ' (filtered)'}
        </p>
      )}

      {viewMode === 'list' ? (
        <ListView tasks={tasks} isLoading={isLoading} onTaskUpdate={refetch} />
      ) : (
        <BoardView tasks={tasks} isLoading={isLoading} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}

export function TaskBoard() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, errorInfo) => console.error('TaskBoard error:', error, errorInfo)}
    >
      <TaskBoardContent />
    </ErrorBoundary>
  );
}
