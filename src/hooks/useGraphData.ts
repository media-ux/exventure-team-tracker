// src/hooks/useGraphData.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export interface GraphNode {
  id: string;
  name: string;
  level: 'company' | 'project' | 'sub-unit' | 'task';
  status?: 'done' | 'in_progress' | 'backlog' | 'blocked';
  projectId?: string;
  assignees?: string[];  // First names only
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

type Tables = Database['public']['Tables'];
type TaskStatus = Database['public']['Enums']['task_status'];

export function useGraphData(
  hierarchyLevel: 'company' | 'project' | 'sub-unit' | 'task',
  parentId: string | null
) {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchGraphData() {
      setLoading(true);
      setError(null);

      try {
        if (hierarchyLevel === 'company') {
          // Fetch company node + all projects
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .limit(1)
            .single();

          if (companyError) throw companyError;

          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('company_id', companyData.id);

          if (projectsError) throw projectsError;

          // Build graph
          const nodes: GraphNode[] = [
            {
              id: companyData.id,
              name: companyData.name,
              level: 'company'
            },
            ...(projectsData || []).map(p => ({
              id: p.id,
              name: p.name,
              level: 'project' as const,
              projectId: p.id
            }))
          ];

          const links: GraphLink[] = (projectsData || []).map(p => ({
            source: companyData.id,
            target: p.id
          }));

          setData({ nodes, links });

        } else if (hierarchyLevel === 'project' && parentId) {
          // Fetch project node + all sub-units
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', parentId)
            .single();

          if (projectError) throw projectError;

          const { data: subUnitsData, error: subUnitsError } = await supabase
            .from('sub_units')
            .select('*')
            .eq('project_id', parentId);

          if (subUnitsError) throw subUnitsError;

          // Build graph
          const nodes: GraphNode[] = [
            {
              id: projectData.id,
              name: projectData.name,
              level: 'project',
              projectId: projectData.id
            },
            ...(subUnitsData || []).map(su => ({
              id: su.id,
              name: su.name,
              level: 'sub-unit' as const,
              projectId: projectData.id
            }))
          ];

          const links: GraphLink[] = (subUnitsData || []).map(su => ({
            source: projectData.id,
            target: su.id
          }));

          setData({ nodes, links });

        } else if (hierarchyLevel === 'sub-unit' && parentId) {
          // Fetch sub-unit node + all tasks with team members
          const { data: subUnitData, error: subUnitError } = await supabase
            .from('sub_units')
            .select(`
              *,
              project:projects(id)
            `)
            .eq('id', parentId)
            .single();

          if (subUnitError) throw subUnitError;

          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select(`
              *,
              team_members:assigned_to(name)
            `)
            .eq('sub_unit_id', parentId);

          if (tasksError) throw tasksError;

          // Extract project ID from sub-unit
          const projectId = (subUnitData.project as unknown as { id: string })?.id || '';

          // Build graph
          const nodes: GraphNode[] = [
            {
              id: subUnitData.id,
              name: subUnitData.name,
              level: 'sub-unit',
              projectId
            },
            ...(tasksData || []).map(task => {
              // Extract first name from team_members.name
              const assigneeName = (task.team_members as unknown as { name: string } | null)?.name;
              const firstName = assigneeName ? assigneeName.split(' ')[0] : undefined;

              return {
                id: task.id,
                name: task.title,
                level: 'task' as const,
                status: task.status as TaskStatus,
                projectId,
                assignees: firstName ? [firstName] : undefined
              };
            })
          ];

          const links: GraphLink[] = (tasksData || []).map(task => ({
            source: subUnitData.id,
            target: task.id
          }));

          setData({ nodes, links });

        } else {
          // Invalid hierarchy level or missing parentId
          setData({ nodes: [], links: [] });
        }

      } catch (err) {
        setError(err as Error);
        setData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [hierarchyLevel, parentId]);

  return { data, loading, error };
}
