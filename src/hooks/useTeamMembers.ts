import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type TeamMember = Database['public']['Tables']['team_members']['Row'] & {
  tasks?: { count: number }[]
}

type Task = Database['public']['Tables']['tasks']['Row'] & {
  sub_units?: {
    name: string
    projects?: {
      name: string
    }
  }
}

// Hardcoded company ID for single-company MVP
const COMPANY_ID = '00000000-0000-0000-0000-000000000001'

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch team members with task counts
  const fetchTeamMembers = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select(`
          id,
          name,
          role,
          avatar_url,
          tasks:tasks(count)
        `)
        .order('name')

      if (fetchError) throw fetchError

      setTeamMembers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team members')
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load team members on mount
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  // Add new team member
  const addTeamMember = async (name: string, role: string, avatarUrl?: string) => {
    try {
      // Get current user for user_id field
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User must be authenticated to add team members')
      }

      const { data, error: insertError } = await supabase
        .from('team_members')
        .insert({
          name,
          role,
          avatar_url: avatarUrl || null,
          company_id: COMPANY_ID,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh team members list
      await fetchTeamMembers()

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team member'
      setError(errorMessage)
      console.error('Error adding team member:', err)
      throw err
    }
  }

  // Get tasks assigned to a specific team member
  const getTeamMemberTasks = async (memberId: string): Promise<Task[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          due_date,
          description,
          assigned_to,
          created_at,
          created_by,
          sub_unit_id,
          updated_at,
          sub_units(
            name,
            projects(
              name
            )
          )
        `)
        .eq('assigned_to', memberId)

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      console.error('Error fetching team member tasks:', err)
      throw err
    }
  }

  return {
    teamMembers,
    loading,
    error,
    addTeamMember,
    getTeamMemberTasks,
    refreshTeamMembers: fetchTeamMembers
  }
}
