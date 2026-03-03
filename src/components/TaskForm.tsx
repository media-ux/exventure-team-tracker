import { useState, useEffect } from 'react'
import type { Tables, Enums } from '../lib/database.types'
import { theme } from '../lib/theme'

type TaskStatus = Enums<'task_status'>
type TeamMember = Tables<'team_members'>

interface TaskFormProps {
  onSubmit: (taskData: {
    title: string
    description: string
    assignedTo: string | null
    dueDate: string | null
    status: TaskStatus
  }) => void | Promise<void>
  initialValues?: {
    title?: string
    description?: string
    assignedTo?: string | null
    dueDate?: string | null
    status?: TaskStatus
  }
  teamMembers: TeamMember[]
  onCancel?: () => void
}

export function TaskForm({ onSubmit, initialValues, teamMembers, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [assignedTo, setAssignedTo] = useState<string>(initialValues?.assignedTo || '')
  const [dueDate, setDueDate] = useState(initialValues?.dueDate || '')
  const [status, setStatus] = useState<TaskStatus>(initialValues?.status || 'backlog')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || '')
      setDescription(initialValues.description || '')
      setAssignedTo(initialValues.assignedTo || '')
      setDueDate(initialValues.dueDate || '')
      setStatus(initialValues.status || 'backlog')
    }
  }, [initialValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Title is required')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        title,
        description,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        status
      })

      if (!initialValues) {
        setTitle('')
        setDescription('')
        setAssignedTo('')
        setDueDate('')
        setStatus('backlog')
      }
    } catch (err) {
      console.error('Error submitting task:', err)
      alert('Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: theme.textSecondary }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px' }

  return (
    <form onSubmit={handleSubmit} style={{
      marginBottom: '20px',
      padding: '15px',
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      backgroundColor: theme.bgSurface,
    }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Assignee</label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle}>
          <option value="">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} - {member.role}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Due Date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
          <option value="backlog">Backlog</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: loading ? theme.bgElevated : theme.green,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : (initialValues ? 'Update Task' : 'Create Task')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: theme.bgElevated,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
