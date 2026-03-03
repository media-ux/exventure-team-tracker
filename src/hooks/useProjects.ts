import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert } from '../lib/database.types'

type ProjectMember = {
  id: string
  team_member_id: string
  team_members: { id: string; name: string; role: string; avatar_url: string | null }
}

type Project = Tables<'projects'> & {
  sub_units: Array<Tables<'sub_units'> & { task_count?: number }>
  project_members?: ProjectMember[]
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          code_name,
          company_id,
          created_by,
          created_at,
          updated_at,
          sub_units(
            id,
            name,
            description,
            project_id,
            created_at
          ),
          project_members(
            id,
            team_member_id,
            team_members(
              id,
              name,
              role,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Fetch task counts for each sub-unit
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const subUnitsWithCounts = await Promise.all(
            (project.sub_units || []).map(async (subUnit) => {
              const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('sub_unit_id', subUnit.id)

              return {
                ...subUnit,
                task_count: count || 0
              }
            })
          )

          return {
            ...project,
            sub_units: subUnitsWithCounts
          }
        })
      )

      setProjects(projectsWithCounts as Project[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const addProject = async (name: string, codeName: string, memberIds?: string[]) => {
    try {
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Get user's company
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (!teamMember) throw new Error('User is not associated with a company')

      const projectData: TablesInsert<'projects'> = {
        name,
        code_name: codeName,
        company_id: teamMember.company_id,
        created_by: user.id
      }

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (insertError) throw insertError

      // Add project members if provided
      if (memberIds && memberIds.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberIds.map(mid => ({
            project_id: data.id,
            team_member_id: mid
          })))

        if (membersError) {
          console.error('Error adding project members:', membersError)
        }
      }

      // Refetch to update UI
      await fetchProjects()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project')
      console.error('Error adding project:', err)
      throw err
    }
  }

  const updateProjectMembers = async (projectId: string, memberIds: string[]) => {
    try {
      setError(null)

      // Remove all existing members
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)

      if (deleteError) throw deleteError

      // Add new members
      if (memberIds.length > 0) {
        const { error: insertError } = await supabase
          .from('project_members')
          .insert(memberIds.map(mid => ({
            project_id: projectId,
            team_member_id: mid
          })))

        if (insertError) throw insertError
      }

      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project members')
      console.error('Error updating project members:', err)
      throw err
    }
  }

  const addSubUnit = async (projectId: string, name: string, description?: string) => {
    try {
      setError(null)

      const subUnitData: TablesInsert<'sub_units'> = {
        project_id: projectId,
        name,
        description: description || null
      }

      const { data, error: insertError } = await supabase
        .from('sub_units')
        .insert(subUnitData)
        .select()
        .single()

      if (insertError) throw insertError

      // Refetch to update UI
      await fetchProjects()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sub-unit')
      console.error('Error adding sub-unit:', err)
      throw err
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (deleteError) throw deleteError

      // Refetch to update UI
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      console.error('Error deleting project:', err)
      throw err
    }
  }

  return {
    projects,
    addProject,
    addSubUnit,
    deleteProject,
    updateProjectMembers,
    loading,
    error,
    refetch: fetchProjects
  }
}
