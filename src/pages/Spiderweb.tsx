// src/pages/Spiderweb.tsx
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SpiderwebGraph } from '../components/SpiderwebGraph';
import { GraphBreadcrumb } from '../components/GraphBreadcrumb';
import { ErrorFallback } from '../components/ErrorFallback';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

interface HierarchyState {
  level: 'company' | 'project' | 'sub-unit' | 'task';
  parentId: string | null;
  breadcrumb: Array<{ id: string; name: string; level: string }>;
}

function getNextLevel(current: string): 'company' | 'project' | 'sub-unit' | 'task' {
  const map: Record<string, 'company' | 'project' | 'sub-unit' | 'task'> = {
    'company': 'project',
    'project': 'sub-unit',
    'sub-unit': 'task'
  };
  return map[current] || current as 'company' | 'project' | 'sub-unit' | 'task';
}

function getPrevLevel(current: string): 'company' | 'project' | 'sub-unit' | 'task' {
  const map: Record<string, 'company' | 'project' | 'sub-unit' | 'task'> = {
    'project': 'company',
    'sub-unit': 'project',
    'task': 'sub-unit'
  };
  return map[current] || current as 'company' | 'project' | 'sub-unit' | 'task';
}

function SpiderwebContent() {
  const [hierarchy, setHierarchy] = useState<HierarchyState>({
    level: 'company',
    parentId: null,
    breadcrumb: [{ id: 'root', name: 'Ex-Venture', level: 'company' }]
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useRealtimeSubscription({
    table: 'tasks',
    onInsert: () => setRefreshKey(prev => prev + 1),
    onUpdate: () => setRefreshKey(prev => prev + 1),
    onDelete: () => setRefreshKey(prev => prev + 1)
  });

  useRealtimeSubscription({
    table: 'projects',
    onInsert: () => setRefreshKey(prev => prev + 1),
    onUpdate: () => setRefreshKey(prev => prev + 1),
    onDelete: () => setRefreshKey(prev => prev + 1)
  });

  useRealtimeSubscription({
    table: 'sub_units',
    onInsert: () => setRefreshKey(prev => prev + 1),
    onUpdate: () => setRefreshKey(prev => prev + 1),
    onDelete: () => setRefreshKey(prev => prev + 1)
  });

  const handleNavigateDown = (nodeId: string, nodeName: string, nodeLevel: string) => {
    setHierarchy(prev => ({
      level: getNextLevel(prev.level),
      parentId: nodeId,
      breadcrumb: [...prev.breadcrumb, { id: nodeId, name: nodeName, level: nodeLevel }]
    }));
  };

  const handleNavigateUp = () => {
    setHierarchy(prev => {
      if (prev.breadcrumb.length <= 1) return prev;
      const newBreadcrumb = prev.breadcrumb.slice(0, -1);
      const parent = newBreadcrumb[newBreadcrumb.length - 1];
      return {
        level: getPrevLevel(prev.level),
        parentId: parent.id === 'root' ? null : parent.id,
        breadcrumb: newBreadcrumb
      };
    });
  };

  const handleBreadcrumbNavigate = (id: string, level: string) => {
    const index = hierarchy.breadcrumb.findIndex(item => item.id === id);
    if (index >= 0) {
      const newBreadcrumb = hierarchy.breadcrumb.slice(0, index + 1);
      setHierarchy({
        level: level as 'company' | 'project' | 'sub-unit' | 'task',
        parentId: id === 'root' ? null : id,
        breadcrumb: newBreadcrumb
      });
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <GraphBreadcrumb
        items={hierarchy.breadcrumb}
        onNavigate={handleBreadcrumbNavigate}
      />
      <SpiderwebGraph
        key={refreshKey}
        hierarchyLevel={hierarchy.level}
        parentId={hierarchy.parentId}
        onNavigateDown={handleNavigateDown}
        onNavigateUp={handleNavigateUp}
      />
    </div>
  );
}

export function Spiderweb() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <SpiderwebContent />
    </ErrorBoundary>
  );
}
