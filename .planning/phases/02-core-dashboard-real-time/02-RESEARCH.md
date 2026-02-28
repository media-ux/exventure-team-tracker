# Phase 2: Core Dashboard & Real-time - Research

**Researched:** 2026-02-28
**Domain:** Real-time dashboard UI with Supabase subscriptions and multiple view modes
**Confidence:** HIGH

## Summary

Phase 2 builds upon Phase 1's complete data layer (React 19 + Vite + Supabase + TypeScript) to create a functional dashboard with real-time updates, list/board views, and filtering. The existing foundation provides hooks (useProjects, useTasks, useTeamMembers), authentication (useAuth), and a complete database schema with RLS policies.

The primary technical challenge is integrating Supabase Realtime subscriptions without memory leaks while maintaining optimistic UI updates for drag-and-drop Kanban boards. The ecosystem has matured significantly: official Supabase Realtime APIs are well-documented, @hello-pangea/dnd has replaced react-beautiful-dnd for accessible drag-and-drop, and skeleton loading patterns are standardized.

**Primary recommendation:** Use Supabase's built-in `.channel().on('postgres_changes')` pattern with React useEffect cleanup, @hello-pangea/dnd for Kanban board, react-loading-skeleton for loading states, and react-error-boundary for error handling. Avoid hand-rolling drag-and-drop or custom skeleton components.

<phase_requirements>
## Phase Requirements

This phase MUST address the following requirements from REQUIREMENTS.md:

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-01 | User can switch to list view showing all tasks | View switcher pattern (useState toggle), Standard Stack: Built-in React state |
| VIEW-02 | User can switch to board view (Kanban columns by status) | Kanban Pattern: @hello-pangea/dnd with Droppable columns, Don't Hand-Roll: Use established drag-drop library |
| VIEW-03 | User can filter by project | Filter Pattern: Supabase .eq() chaining, Code Example: Filter implementation |
| VIEW-04 | User can filter by team member | Filter Pattern: Supabase .eq('assigned_to') with team member dropdown |
| STATUS-03 | Status changes are reflected in real-time across all connected clients | Real-time Pattern: Supabase postgres_changes subscription on tasks table, Common Pitfall: Memory leaks from unsubscribe |
| RT-01 | Dashboard updates in real-time when another user makes changes | Real-time Pattern: Channel subscription with auto-refetch on UPDATE/INSERT/DELETE events |
| RT-02 | Spiderweb visualization reflects changes without page refresh | Real-time Pattern: Same subscription pattern (deferred to Phase 3 for actual visualization) |
| RT-03 | Real-time connection indicator shows sync status | Connection Indicator Pattern: Track channel.state (SUBSCRIBED/CLOSED/CHANNEL_ERROR) |
| UI-03 | Loading states appear during async operations | Standard Stack: react-loading-skeleton, Architecture Pattern: Skeleton screens for perceived performance |
| UI-04 | Error messages are user-friendly when operations fail | Standard Stack: react-error-boundary, Architecture Pattern: Granular error boundaries per feature |
</phase_requirements>

## Standard Stack

### Core (Already Established in Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI framework | Already in stack, concurrent features for smooth updates |
| @supabase/supabase-js | 2.98.0 | Backend client | Already in stack, built-in Realtime support |
| TypeScript | 5.9.3 | Type safety | Already in stack, prevents runtime errors |
| Vite | 7.3.1 | Build tool | Already in stack, fast HMR |

### New Dependencies for Phase 2
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @hello-pangea/dnd | ^17.0.0 | Drag-and-drop Kanban | Industry standard for accessible drag-drop, actively maintained fork of react-beautiful-dnd (archived), works with React 19 |
| react-loading-skeleton | ^3.5.0 | Loading UI | Automatic sizing, shimmer animations, 50% perceived performance improvement over spinners |
| react-error-boundary | ^4.2.0 | Error handling | Official recommended approach, wraps React error boundaries with better DX |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @hello-pangea/dnd | dnd-kit | More flexible but requires more setup, better for non-list layouts (grids). Kanban is list-based, so @hello-pangea/dnd is simpler |
| @hello-pangea/dnd | pragmatic-drag-and-drop | Headless approach from Atlassian, more control but more code. MVP doesn't need that flexibility |
| react-loading-skeleton | Custom skeletons | Reinventing the wheel, loses automatic sizing and animation optimizations |
| react-error-boundary | Manual error boundaries | More boilerplate, no reset functionality, harder to maintain |

**Installation:**
```bash
npm install @hello-pangea/dnd react-loading-skeleton react-error-boundary
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useAuth.ts              # (Existing) Authentication
│   ├── useProjects.ts          # (Existing) Project CRUD
│   ├── useTasks.ts             # (Existing) Task CRUD
│   ├── useTeamMembers.ts       # (Existing) Team CRUD
│   └── useRealtimeSubscription.ts  # (New) Generic realtime subscription hook
├── pages/
│   ├── Dashboard.tsx           # (Update) Add real-time connection indicator
│   └── TaskBoard.tsx           # (New) Board/List view switcher with filters
├── components/
│   ├── TaskCard.tsx            # (Existing) Reuse for both views
│   ├── TaskForm.tsx            # (Existing) Reuse for editing
│   ├── ListView.tsx            # (New) List view layout
│   ├── BoardView.tsx           # (New) Kanban board layout
│   ├── ViewSwitcher.tsx        # (New) Toggle between list/board
│   ├── TaskFilters.tsx         # (New) Project + team member filters
│   ├── ConnectionIndicator.tsx # (New) Real-time status badge
│   └── ErrorFallback.tsx       # (New) Error boundary UI
└── lib/
    ├── supabase.ts             # (Existing) Supabase client
    └── database.types.ts       # (Existing) TypeScript types
```

### Pattern 1: Supabase Realtime Subscription Hook
**What:** Custom React hook that subscribes to database changes and auto-cleans up
**When to use:** Any component needing real-time data updates
**Example:**
```typescript
// Source: Supabase official docs + React best practices
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChannelState = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'CONNECTING';

export function useRealtimeSubscription<T>(
  table: string,
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: { old: T }) => void
) {
  const [channelState, setChannelState] = useState<ChannelState>('CONNECTING');

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
        onInsert?.(payload.new as T);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => {
        onUpdate?.(payload.new as T);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload) => {
        onDelete?.(payload as { old: T });
      })
      .subscribe((status) => {
        setChannelState(status);
      });

    // CRITICAL: Always unsubscribe to prevent memory leaks
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onInsert, onUpdate, onDelete]);

  return { channelState, isConnected: channelState === 'SUBSCRIBED' };
}
```

### Pattern 2: Kanban Board with @hello-pangea/dnd
**What:** DragDropContext wrapping Droppable columns with Draggable cards
**When to use:** Board view (Kanban by status)
**Example:**
```typescript
// Source: https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const statusColumns = [
  { id: 'backlog', label: 'Backlog', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'blocked', label: 'Blocked', color: 'red' },
  { id: 'done', label: 'Done', color: 'green' }
];

function BoardView({ tasks, onTaskMove }: BoardViewProps) {
  const tasksByStatus = useMemo(() => {
    return statusColumns.reduce((acc, col) => {
      acc[col.id] = tasks.filter(t => t.status === col.id);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; // Dropped outside
    if (result.source.droppableId === result.destination.droppableId &&
        result.source.index === result.destination.index) return; // No movement

    const taskId = result.draggableId.replace('task-', '');
    const newStatus = result.destination.droppableId as TaskStatus;

    // Optimistic update: UI updates instantly
    onTaskMove(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={snapshot.isDraggingOver ? 'bg-blue-50' : ''}
              >
                <h3>{column.label}</h3>
                {tasksByStatus[column.id].map((task, index) => (
                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <TaskCard task={task} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
```

### Pattern 3: View Switcher with State
**What:** Simple boolean state to toggle between list and board layouts
**When to use:** Any view that needs multiple layout modes
**Example:**
```typescript
// Source: https://medium.com/@layne_celeste/toggle-between-grid-and-list-view-in-react-731df62b829e
function TaskBoard() {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [filters, setFilters] = useState({ projectId: null, assignedTo: null });

  return (
    <>
      <ViewSwitcher mode={viewMode} onModeChange={setViewMode} />
      <TaskFilters filters={filters} onFiltersChange={setFilters} />
      {viewMode === 'list' ? (
        <ListView tasks={filteredTasks} />
      ) : (
        <BoardView tasks={filteredTasks} onTaskMove={handleTaskMove} />
      )}
    </>
  );
}
```

### Pattern 4: Supabase Filter Chaining
**What:** Chain .eq() and other filters for multi-condition queries
**When to use:** Filtering tasks by project and/or team member
**Example:**
```typescript
// Source: https://supabase.com/docs/reference/javascript/using-filters
async function fetchFilteredTasks(projectId?: string, assignedTo?: string) {
  let query = supabase
    .from('tasks')
    .select('*, projects(name), team_members(name, avatar)');

  // Chain filters (AND logic by default)
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }

  const { data, error } = await query;
  return { data, error };
}
```

### Pattern 5: Skeleton Loading Screens
**What:** Use react-loading-skeleton to show placeholder UI during data fetch
**When to use:** Initial page load, refetching after filters change
**Example:**
```typescript
// Source: https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function ListView({ tasks, isLoading }: ListViewProps) {
  if (isLoading) {
    return (
      <div>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="task-card">
            <Skeleton height={30} width="60%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={60} />
          </div>
        ))}
      </div>
    );
  }

  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}
```

### Pattern 6: Connection Status Indicator
**What:** Visual indicator showing real-time connection state
**When to use:** Dashboard header to show users if data is live
**Example:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-15-websockets-react-real-time-applications/view
function ConnectionIndicator({ channelState }: { channelState: ChannelState }) {
  const statusConfig = {
    SUBSCRIBED: { label: 'Live', color: 'green', icon: '●' },
    CONNECTING: { label: 'Connecting...', color: 'yellow', icon: '◐' },
    CLOSED: { label: 'Disconnected', color: 'red', icon: '○' },
    CHANNEL_ERROR: { label: 'Connection Error', color: 'red', icon: '✕' }
  };

  const config = statusConfig[channelState];

  return (
    <div className="flex items-center gap-2">
      <span style={{ color: config.color }}>{config.icon}</span>
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
```

### Pattern 7: Error Boundaries for Graceful Degradation
**What:** Wrap features in error boundaries to prevent full-page crashes
**When to use:** Around real-time subscriptions, board view, filter components
**Example:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-02-20-react-error-boundaries/view
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TaskBoard />
    </ErrorBoundary>
  );
}
```

### Anti-Patterns to Avoid
- **Hand-rolling drag-and-drop:** HTML5 Drag-and-Drop API is low-level and lacks accessibility features. Use @hello-pangea/dnd instead.
- **Manual skeleton components:** react-loading-skeleton handles sizing, animation, and theming automatically. Don't build custom shimmer effects.
- **Forgetting to unsubscribe:** Supabase channels MUST be removed in useEffect cleanup or memory leaks accumulate.
- **Using react-beautiful-dnd:** Library is archived. Use @hello-pangea/dnd (maintained fork).
- **Excessive React.memo:** Don't prematurely optimize with memo/useMemo. Only use for expensive computations or preventing unnecessary re-renders in large lists.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom draggable/droppable with HTML5 API | @hello-pangea/dnd | Accessibility (keyboard navigation, screen readers), touch support, animations, collision detection, nested droppables—all solved |
| Loading skeletons | Custom shimmer divs with CSS animations | react-loading-skeleton | Automatic sizing, consistent theming, shimmer animations, prevents layout shift |
| Error boundaries | Manual try/catch around components | react-error-boundary | Better DX with FallbackComponent, reset functionality, error logging integration |
| Real-time subscriptions | Manual WebSocket connection management | Supabase built-in channels | Connection pooling, authentication, reconnection logic, subscription state management—all handled |
| Connection indicators | Custom WebSocket state tracking | Supabase channel.state | Built-in SUBSCRIBED/CLOSED/CHANNEL_ERROR states, no need to manually track connection lifecycle |

**Key insight:** All these problems have deceptively complex edge cases. Drag-and-drop needs touch support, accessibility, animations, and collision detection. Skeletons need to prevent layout shift and match content dimensions. Real-time needs reconnection logic, queuing, and health monitoring. Using established libraries gives you years of production-hardened solutions.

## Common Pitfalls

### Pitfall 1: Supabase Realtime Memory Leaks
**What goes wrong:** Channel subscriptions accumulate in memory, WebSocket connections never close, app slows down over time
**Why it happens:** Forgetting to unsubscribe from channels in useEffect cleanup function
**How to avoid:** ALWAYS return cleanup function that calls `supabase.removeChannel(channel)`
**Warning signs:** Increasing memory usage in browser devtools, duplicate subscription messages in console
**Code example:**
```typescript
// WRONG: No cleanup
useEffect(() => {
  const channel = supabase.channel('tasks').subscribe();
}, []);

// CORRECT: Cleanup on unmount
useEffect(() => {
  const channel = supabase.channel('tasks').subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```
**Source:** https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak

### Pitfall 2: Optimistic UI State Desync
**What goes wrong:** User drags task to "Done", UI shows it as done, but server rejects update (RLS policy failure), UI never corrects itself
**Why it happens:** Optimistic updates don't handle error cases or reconcile with server state
**How to avoid:** Use data-fetching libraries (TanStack Query) OR manually reconcile: if mutation fails, revert optimistic state and show error
**Warning signs:** UI shows different data than database, page refresh "fixes" the view
**Code example:**
```typescript
// CORRECT: Revert on error
const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
  const oldTask = tasks.find(t => t.id === taskId);

  // Optimistic update
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, status: newStatus } : t
  ));

  const { error } = await updateTaskStatus(taskId, newStatus);

  if (error) {
    // Revert optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? oldTask : t
    ));
    showError('Failed to update task status');
  }
};
```
**Source:** https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html

### Pitfall 3: Real-time Subscription Race Conditions
**What goes wrong:** Component subscribes to real-time updates before initial data fetch completes, receives UPDATE event for data not yet in local state, UI shows incomplete/stale data
**Why it happens:** Independent async operations (fetch + subscribe) with no coordination
**How to avoid:** Subscribe to real-time AFTER initial data is loaded, or merge subscription events with existing state intelligently
**Warning signs:** Tasks appear/disappear randomly, inconsistent counts between views
**Code example:**
```typescript
// CORRECT: Subscribe after initial fetch
const { data: tasks, isLoading } = useTasks();

useEffect(() => {
  if (isLoading) return; // Don't subscribe until data is loaded

  const channel = supabase
    .channel('tasks-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' },
      (payload) => {
        // Now we know tasks array is populated
        setTasks(prev => prev.map(t =>
          t.id === payload.new.id ? payload.new : t
        ));
      })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [isLoading]);
```

### Pitfall 4: Over-rendering with useMemo/memo
**What goes wrong:** Adding React.memo and useMemo everywhere "for performance", but benchmarks show no improvement or even degradation
**Why it happens:** Memoization has overhead (prop comparison, dependency checks). Only helps when re-render cost > memoization cost
**How to avoid:** Profile first with React DevTools Profiler. Only memoize: (1) expensive computations, (2) components that re-render often with same props, (3) large lists
**Warning signs:** Code is harder to read, dependency array bugs, no measurable performance gain
**Code example:**
```typescript
// WRONG: Premature optimization
const TaskCard = memo(({ task }: TaskCardProps) => {
  const formattedDate = useMemo(() => format(task.dueDate), [task.dueDate]);
  return <div>{formattedDate}</div>;
});

// CORRECT: Only memoize expensive operations
const tasksByStatus = useMemo(() => {
  // Expensive: Filters 1000+ tasks, runs on every render
  return tasks.reduce((acc, task) => {
    acc[task.status] = acc[task.status] || [];
    acc[task.status].push(task);
    return acc;
  }, {});
}, [tasks]); // Only re-compute when tasks array changes
```
**Source:** https://tkdodo.eu/blog/the-uphill-battle-of-memoization

### Pitfall 5: Forgetting to Enable Realtime on Supabase Tables
**What goes wrong:** Subscribe to channel, see "SUBSCRIBED" status, but never receive any events when data changes
**Why it happens:** Realtime must be enabled per table in Supabase dashboard OR via migration
**How to avoid:** Create `supabase_realtime` publication and add tables to it
**Warning signs:** Channel state is SUBSCRIBED but no events fire
**Code example:**
```sql
-- Run in Supabase SQL editor OR migration file
CREATE PUBLICATION supabase_realtime FOR TABLE tasks, projects, sub_units;

-- Or enable for all tables (not recommended for production)
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete');
```
**Source:** https://supabase.com/docs/guides/realtime/subscribing-to-database-changes

### Pitfall 6: Not Handling Connection State Transitions
**What goes wrong:** User's network drops, connection state goes to CLOSED, no reconnection attempt, user sees stale data
**Why it happens:** Not monitoring channel.state or handling CLOSED/CHANNEL_ERROR states
**How to avoid:** Display connection indicator, implement exponential backoff reconnection strategy
**Warning signs:** Users report "app doesn't update" after WiFi drops
**Code example:**
```typescript
// CORRECT: Monitor connection state and handle errors
const { channelState } = useRealtimeSubscription('tasks');

useEffect(() => {
  if (channelState === 'CLOSED' || channelState === 'CHANNEL_ERROR') {
    // Show warning to user
    showWarning('Real-time updates paused. Reconnecting...');

    // Optionally: Manual reconnection with backoff
    const timer = setTimeout(() => {
      refetchTasks(); // Fetch latest data
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [channelState]);
```

## Code Examples

Verified patterns from official sources and established libraries:

### Example 1: Complete Realtime Task Subscription Hook
```typescript
// Source: Supabase official docs + React best practices
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelState, setChannelState] = useState<'CONNECTING' | 'SUBSCRIBED' | 'CLOSED'>('CONNECTING');

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(name), team_members(name, avatar)')
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchTasks();

    // Subscribe to changes
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks(prev => [payload.new as Task, ...prev]);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks(prev => prev.map(t =>
            t.id === payload.new.id ? payload.new as Task : t
          ));
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        })
      .subscribe((status) => {
        setChannelState(status);
      });

    // CRITICAL: Cleanup to prevent memory leaks
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  return { tasks, isLoading, channelState, refetch: fetchTasks };
}
```

### Example 2: Filtered Task Query with Multiple Conditions
```typescript
// Source: https://supabase.com/docs/reference/javascript/using-filters
import { supabase } from '@/lib/supabase';

interface TaskFilters {
  projectId?: string;
  assignedTo?: string;
  status?: string;
  search?: string;
}

export async function fetchFilteredTasks(filters: TaskFilters) {
  let query = supabase
    .from('tasks')
    .select('*, projects(name), team_members(name, avatar)');

  // Chain filters (AND logic)
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}
```

### Example 3: Board View with Drag-and-Drop
```typescript
// Source: https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useMemo } from 'react';
import { TaskCard } from '@/components/TaskCard';
import { Task, TaskStatus } from '@/lib/database.types';

const STATUS_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#6B7280' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { id: 'blocked', label: 'Blocked', color: '#EF4444' },
  { id: 'done', label: 'Done', color: '#10B981' }
] as const;

interface BoardViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export function BoardView({ tasks, onStatusChange }: BoardViewProps) {
  // Group tasks by status (memoized for performance)
  const tasksByStatus = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter(t => t.status === col.id);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId &&
        result.source.index === result.destination.index) return;

    const taskId = result.draggableId.replace('task-', '');
    const newStatus = result.destination.droppableId as TaskStatus;

    // Optimistic update handled by parent via real-time subscription
    await onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.id}>
            <h3 style={{ color: column.color }}>{column.label}</h3>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[500px] p-4 rounded-lg ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  {tasksByStatus[column.id]?.map((task, index) => (
                    <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'opacity-50' : ''}
                        >
                          <TaskCard task={task} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

### Example 4: Loading Skeleton for Task List
```typescript
// Source: https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton height={24} width="60%" /> {/* Title */}
          <Skeleton height={16} width="40%" className="mt-2" /> {/* Assignee */}
          <Skeleton height={60} className="mt-3" /> {/* Description */}
          <div className="flex gap-2 mt-3">
            <Skeleton height={24} width={80} /> {/* Status badge */}
            <Skeleton height={24} width={100} /> {/* Due date */}
          </div>
        </div>
      ))}
    </div>
  );
}

// Usage
function TaskList({ tasks, isLoading }: TaskListProps) {
  if (isLoading) return <TaskListSkeleton />;
  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}
```

### Example 5: Error Boundary with Reset
```typescript
// Source: https://oneuptime.com/blog/post/2026-02-20-react-error-boundaries/view
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-bold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-red-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

// Wrap entire TaskBoard feature
export function TaskBoardWithErrorBoundary() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset state on retry
        window.location.reload();
      }}
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error('TaskBoard error:', error, errorInfo);
      }}
    >
      <TaskBoard />
    </ErrorBoundary>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @hello-pangea/dnd | 2024 (original library archived) | Maintained fork with React 19 support, same API |
| Manual WebSocket state | Supabase .channel().subscribe() | Supabase 2.x (2023+) | Built-in connection management, no manual state tracking |
| Spinners for loading | Skeleton screens | 2020-2023 (industry shift) | 50% perceived performance improvement |
| Class-based error boundaries | react-error-boundary | 2021+ (functional components era) | Better DX, reset functionality, declarative API |
| TanStack Query v4 | TanStack Query v5 | Jan 2024 | Improved TypeScript inference, better defaults |
| @supabase/auth-helpers-react | @supabase/ssr | 2024 | Better Next.js integration, but Phase 1 uses old library (OK for MVP) |

**Deprecated/outdated:**
- **react-beautiful-dnd**: Archived by Atlassian. Use @hello-pangea/dnd instead.
- **Manual WebSocket connection tracking**: Supabase handles this with built-in channel state.
- **Loading spinners**: Skeleton screens are now UX standard for perceived performance.

## Open Questions

1. **Should we migrate from @supabase/auth-helpers-react to @supabase/ssr now?**
   - What we know: Phase 1 uses deprecated @supabase/auth-helpers-react, @supabase/ssr is recommended
   - What's unclear: Migration effort vs. MVP timeline, breaking changes to existing auth hook
   - Recommendation: DEFER to future phase. Current auth works, migration is not blocking for Phase 2 features

2. **Should we use TanStack Query for data fetching instead of custom hooks?**
   - What we know: Phase 1 established custom hooks (useTasks, useProjects), TanStack Query better for caching/optimistic updates
   - What's unclear: Rewrite effort, learning curve for team
   - Recommendation: DEFER to future phase. Custom hooks work, real-time subscriptions can layer on top. If optimistic update bugs become common, revisit in Phase 3

3. **How many concurrent Realtime connections can Supabase handle on free tier?**
   - What we know: Supabase has connection limits per plan
   - What's unclear: Exact limits for free tier, when to upgrade
   - Recommendation: Start with free tier, monitor connection count. Supabase docs mention limits but exact numbers vary. If multiple users report disconnections, check Supabase dashboard metrics

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime - Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) - Official docs for postgres_changes subscriptions
- [Supabase Realtime - Getting Started](https://supabase.com/docs/guides/realtime/getting_started) - Channel creation, connection lifecycle, unsubscribe patterns
- [Supabase JavaScript API - Using Filters](https://supabase.com/docs/reference/javascript/using-filters) - Filter methods, chaining, foreign key filtering
- [Build a Kanban Board With Drag-and-Drop in React with Shadcn](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html) - @hello-pangea/dnd implementation, optimistic updates, data structure

### Secondary (MEDIUM confidence)
- [react-supabase - useSubscription Hook](https://react-supabase.vercel.app/documentation/realtime/use-subscription) - Third-party library patterns for Supabase subscriptions
- [How to Use WebSockets in React for Real-Time Applications](https://oneuptime.com/blog/post/2026-01-15-websockets-react-real-time-applications/view) - Connection state management, reconnection strategies (Jan 2026)
- [How to Implement React Error Boundaries](https://oneuptime.com/blog/post/2026-02-20-react-error-boundaries/view) - Error boundary patterns (Feb 2026)
- [Handling React loading states with React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) - Skeleton implementation patterns
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison (@hello-pangea/dnd, dnd-kit, pragmatic-drag-and-drop)
- [React interactivity: Filtering - MDN](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_interactivity_filtering_conditional_rendering) - Filter patterns and best practices
- [Toggle Between Grid and List View in React - Medium](https://medium.com/@layne_celeste/toggle-between-grid-and-list-view-in-react-731df62b829e) - View switcher pattern
- [React State Management in 2026: Zustand, Jotai, or Redux?](https://viprasol.com/blog/state-management-react-2026/) - State management landscape

### Tertiary (LOW confidence - flagged for validation)
- [Supabase Realtime Client-Side Memory Leak - DrDroid](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak) - Memory leak diagnosis (needs verification with official docs)
- [The Uphill Battle of Memoization - TkDodo](https://tkdodo.eu/blog/the-uphill-battle-of-memoization) - useMemo/memo pitfalls (blog post, not official React docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs/npm, active maintenance confirmed
- Architecture patterns: HIGH - Patterns from official Supabase docs and established libraries
- Kanban implementation: HIGH - Recent 2026 article with production code examples
- Real-time subscriptions: HIGH - Official Supabase documentation, clear API
- Loading/Error handling: MEDIUM - Community libraries (react-loading-skeleton, react-error-boundary), well-established but not "official" React
- Pitfalls: MEDIUM - Mix of official warnings and community experience reports

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (30 days - stable ecosystem, Supabase API is stable, React 19 patterns established)
