import { useState } from 'react'
import type { Tables, Enums } from '../lib/database.types'
import { TaskForm } from './TaskForm'

type Task = Tables<'tasks'> & {
  assigned_to_member: Tables<'team_members'> | null
}
type TaskStatus = Enums<'task_status'>
type TeamMember = Tables<'team_members'>

interface TaskCardProps {
  task: Task
  teamMembers: TeamMember[]
  onEdit: (taskId: string, updates: Partial<Task>) => void | Promise<void>
  onDelete: (taskId: string) => void | Promise<void>
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void | Promise<void>
}

export function TaskCard({ task, teamMembers, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(task.id)
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus
    try {
      await onStatusChange(task.id, newStatus)
    } catch (err) {
      console.error('Error changing status:', err)
      alert('Failed to change status')
    }
  }

  const handleEditSubmit = async (taskData: any) => {
    try {
      await onEdit(task.id, {
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assignedTo,
        due_date: taskData.dueDate,
        status: taskData.status
      })
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'backlog': return '#888'
      case 'in_progress': return '#2196F3'
      case 'blocked': return '#f44336'
      case 'done': return '#4CAF50'
      default: return '#888'
    }
  }

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'backlog': return 'Backlog'
      case 'in_progress': return 'In Progress'
      case 'blocked': return 'Blocked'
      case 'done': return 'Done'
      default: return status
    }
  }

  if (isEditing) {
    return (
      <div style={{ marginBottom: '15px', padding: '15px', border: '2px solid #2196F3', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>Edit Task</h4>
        <TaskForm
          onSubmit={handleEditSubmit}
          initialValues={{
            title: task.title,
            description: task.description || '',
            assignedTo: task.assigned_to,
            dueDate: task.due_date,
            status: task.status
          }}
          teamMembers={teamMembers}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
          {task.description && (
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{task.description}</p>
          )}
        </div>

        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: getStatusColor(task.status),
            whiteSpace: 'nowrap',
            marginLeft: '10px'
          }}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', fontSize: '14px' }}>
        <div>
          <strong>Assignee:</strong>{' '}
          {task.assigned_to_member ? (
            <span>{task.assigned_to_member.name} ({task.assigned_to_member.role})</span>
          ) : (
            <span style={{ color: '#999' }}>Unassigned</span>
          )}
        </div>

        <div>
          <strong>Due Date:</strong>{' '}
          {task.due_date ? (
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          ) : (
            <span style={{ color: '#999' }}>No due date</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Status:</label>
          <select
            value={task.status}
            onChange={handleStatusChange}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: isDeleting ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDeleting ? 'not-allowed' : 'pointer'
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
        Created: {new Date(task.created_at || '').toLocaleString()}
        {task.updated_at && task.updated_at !== task.created_at && (
          <> | Updated: {new Date(task.updated_at).toLocaleString()}</>
        )}
      </div>
    </div>
  )
}
