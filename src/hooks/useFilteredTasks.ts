// src/hooks/useFilteredTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

// Extended task with joined data
export interface TaskWithRelations extends Task {
  projects: Pick<Project, 'name' | 'code_name'> | null;
  sub_units: { name: string } | null;
  team_members: Pick<TeamMember, 'name' | 'avatar_url'> | null;
}

export interface TaskFilters {
  projectId: string | null;
  assignedTo: string | null;
}

export function useFilteredTasks(filters: TaskFilters) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query with joins for display data
      let query = supabase
        .from('tasks')
        .select(`
          *,
          sub_units!inner(
            name,
            project_id,
            projects!inner(name, code_name)
          ),
          team_members(name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Apply filters (AND logic via chaining) - Research Pattern 4
      if (filters.projectId) {
        // Filter by project ID through sub_units relationship
        query = query.eq('sub_units.project_id', filters.projectId);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transform the nested data structure to flat TaskWithRelations
      const transformedTasks: TaskWithRelations[] = (data || []).map((task: any) => ({
        ...task,
        projects: task.sub_units?.projects || null,
        sub_units: task.sub_units ? { name: task.sub_units.name } : null,
        team_members: task.team_members || null
      }));

      setTasks(transformedTasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setIsLoading(false);
    }
  }, [filters.projectId, filters.assignedTo]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks
  };
}
