import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert, TablesUpdate, Enums } from '../lib/database.types'

type Task = Tables<'tasks'> & {
  sub_units: Tables<'sub_units'> & {
    projects: Tables<'projects'>
  } | null
  assigned_to_member: Tables<'team_members'> | null
}

type TaskStatus = Enums<'task_status'>

export function useTasks(subUnitId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          created_at,
          updated_at,
          created_by,
          assigned_to,
          sub_unit_id,
          sub_units(
            id,
            name,
            description,
            project_id,
            projects(id, name, code_name)
          ),
          assigned_to_member:team_members!assigned_to(id, name, role, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (subUnitId) {
        query = query.eq('sub_unit_id', subUnitId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setTasks(data as Task[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [subUnitId])

  const addTask = async (
    subUnitId: string,
    title: string,
    description?: string,
    assignedTo?: string,
    dueDate?: string,
    status: TaskStatus = 'backlog'
  ) => {
    try {
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const taskData: TablesInsert<'tasks'> = {
        sub_unit_id: subUnitId,
        title,
        description: description || null,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        status,
        created_by: user.id
      }

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (insertError) throw insertError

      // Refetch to update UI
      await fetchTasks()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
      console.error('Error adding task:', err)
      throw err
    }
  }

  const updateTask = async (taskId: string, updates: TablesUpdate<'tasks'>) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (updateError) throw updateError

      // Refetch to update UI
      await fetchTasks()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      console.error('Error updating task:', err)
      throw err
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) throw deleteError

      // Refetch to update UI
      await fetchTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      console.error('Error deleting task:', err)
      throw err
    }
  }

  const changeStatus = async (taskId: string, newStatus: TaskStatus) => {
    return updateTask(taskId, { status: newStatus })
  }

  const reassignTask = async (taskId: string, newAssigneeId: string | null) => {
    return updateTask(taskId, { assigned_to: newAssigneeId })
  }

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    changeStatus,
    reassignTask,
    loading,
    error,
    refetch: fetchTasks
  }
}
