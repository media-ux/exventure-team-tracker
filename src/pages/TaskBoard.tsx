// src/pages/TaskBoard.tsx
import { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ViewSwitcher, ViewMode } from '../components/ViewSwitcher';
import { TaskFilters } from '../components/TaskFilters';
import { ListView } from '../components/ListView';
import { BoardView } from '../components/BoardView';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { ErrorFallback } from '../components/ErrorFallback';
import { useFilteredTasks, TaskFilters as TaskFiltersType, TaskWithRelations } from '../hooks/useFilteredTasks';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useTasks } from '../hooks/useTasks';
import { Database } from '../lib/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];

function TaskBoardContent() {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filter state
  const [filters, setFilters] = useState<TaskFiltersType>({
    projectId: null,
    assignedTo: null
  });

  // Fetch tasks with filters
  const { tasks, isLoading, error, refetch } = useFilteredTasks(filters);

  // Get update function from useTasks hook
  const { changeStatus } = useTasks();

  // Real-time subscription - refetch on any change (Pitfall 3 solution)
  const { channelState } = useRealtimeSubscription<TaskWithRelations>({
    table: 'tasks',
    onInsert: () => {
      refetch();
    },
    onUpdate: () => {
      refetch();
    },
    onDelete: () => {
      refetch();
    },
    enabled: !isLoading // Wait for initial load (Pitfall 3 from research)
  });

  // Handle status change from board view drag-drop
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await changeStatus(taskId, newStatus);
      // Real-time subscription will trigger refetch
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Refetch to ensure UI is in sync
      refetch();
    }
  }, [changeStatus, refetch]);

  // Handle error state
  if (error) {
    throw error; // Will be caught by ErrorBoundary
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
            Task Board
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            View and manage tasks across all projects
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ConnectionIndicator channelState={channelState} />
          <ViewSwitcher mode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Task count */}
      {!isLoading && (
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px'
          }}
        >
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {(filters.projectId || filters.assignedTo) && ' (filtered)'}
        </p>
      )}

      {/* View content */}
      {viewMode === 'list' ? (
        <ListView
          tasks={tasks}
          isLoading={isLoading}
          onTaskUpdate={refetch}
        />
      ) : (
        <BoardView
          tasks={tasks}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// Export wrapped with ErrorBoundary
export function TaskBoard() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset state on retry - full page reload for simplicity
        window.location.reload();
      }}
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error('TaskBoard error:', error, errorInfo);
      }}
    >
      <TaskBoardContent />
    </ErrorBoundary>
  );
}
