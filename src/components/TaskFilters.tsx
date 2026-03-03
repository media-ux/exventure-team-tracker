// src/components/TaskFilters.tsx
import { useProjects } from '../hooks/useProjects';
import { useTeamMembers } from '../hooks/useTeamMembers';
import type { TaskFilters as TaskFiltersType } from '../hooks/useFilteredTasks';
import { theme } from '../lib/theme';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const { projects } = useProjects();
  const { teamMembers } = useTeamMembers();

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, projectId: value === '' ? null : value });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, assignedTo: value === '' ? null : value });
  };

  const handleClearFilters = () => {
    onFiltersChange({ projectId: null, assignedTo: null });
  };

  const hasActiveFilters = filters.projectId !== null || filters.assignedTo !== null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: theme.bgSurface,
        borderRadius: '8px',
        marginBottom: '16px',
        border: `1px solid ${theme.border}`,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 500, color: theme.textSecondary }}>
        Filters:
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="project-filter" style={{ fontSize: '12px', color: theme.textMuted }}>
          Project
        </label>
        <select
          id="project-filter"
          value={filters.projectId || ''}
          onChange={handleProjectChange}
          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '14px', minWidth: '150px' }}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.code_name})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="assignee-filter" style={{ fontSize: '12px', color: theme.textMuted }}>
          Assigned To
        </label>
        <select
          id="assignee-filter"
          value={filters.assignedTo || ''}
          onChange={handleAssigneeChange}
          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '14px', minWidth: '150px' }}
        >
          <option value="">All Team Members</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          style={{
            padding: '6px 12px',
            backgroundColor: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            fontSize: '13px',
            color: theme.textSecondary,
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
