import { useState, FormEvent } from 'react'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { useTasks } from '../hooks/useTasks'
import type { Database } from '../lib/database.types'

type TaskStatus = Database['public']['Enums']['task_status']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  sub_units?: {
    name: string
    projects?: {
      name: string
    }
  }
}

export function TeamMembers() {
  const { teamMembers, loading, error, addTeamMember, updateTeamMember, deleteTeamMember, getTeamMemberTasks } = useTeamMembers()
  const { updateTask, deleteTask, changeStatus } = useTasks()

  // Form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Selected member state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [memberTasks, setMemberTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Task editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('backlog')
  const [editTaskSubmitting, setEditTaskSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)

    if (!name.trim() || !role.trim()) {
      setFormError('Name and role are required')
      return
    }

    setSubmitting(true)

    try {
      await addTeamMember(name.trim(), role.trim(), avatarUrl.trim() || undefined)

      setName('')
      setRole('')
      setAvatarUrl('')
      setFormSuccess(true)

      setTimeout(() => setFormSuccess(false), 3000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewTasks = async (memberId: string) => {
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null)
      setMemberTasks([])
      return
    }

    setSelectedMemberId(memberId)
    setLoadingTasks(true)

    try {
      const tasks = await getTeamMemberTasks(memberId)
      setMemberTasks(tasks)
    } catch (err) {
      console.error('Failed to load member tasks:', err)
      setMemberTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  const startEditing = (member: { id: string; name: string; role: string; avatar_url: string | null }) => {
    setEditingMemberId(member.id)
    setEditName(member.name)
    setEditRole(member.role)
    setEditAvatarUrl(member.avatar_url || '')
  }

  const handleSaveEdit = async (memberId: string) => {
    if (!editName.trim() || !editRole.trim()) return
    setEditSubmitting(true)
    try {
      await updateTeamMember(memberId, {
        name: editName.trim(),
        role: editRole.trim(),
        avatar_url: editAvatarUrl.trim() || null
      })
      setEditingMemberId(null)
    } catch (err) {
      console.error('Failed to update member:', err)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return
    try {
      await deleteTeamMember(memberId)
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null)
        setMemberTasks([])
      }
    } catch (err) {
      console.error('Failed to delete member:', err)
    }
  }

  // Task actions
  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description || '')
    setEditTaskDueDate(task.due_date || '')
    setEditTaskStatus(task.status as TaskStatus)
  }

  const handleSaveTask = async (taskId: string) => {
    if (!editTaskTitle.trim()) return
    setEditTaskSubmitting(true)
    try {
      await updateTask(taskId, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || null,
        due_date: editTaskDueDate || null,
        status: editTaskStatus,
      })
      // Update local state
      setMemberTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || null,
        due_date: editTaskDueDate || null,
        status: editTaskStatus,
      } : t))
      setEditingTaskId(null)
    } catch (err) {
      console.error('Failed to update task:', err)
    } finally {
      setEditTaskSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"?`)) return
    try {
      await deleteTask(taskId)
      setMemberTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await changeStatus(taskId, newStatus)
      setMemberTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Failed to change task status:', err)
    }
  }

  if (loading) {
    return <div className="loading">Loading team members...</div>
  }

  return (
    <div className="team-members-page">
      <h2>Team Members</h2>

      {/* Add Team Member Form */}
      <div className="add-member-form">
        <h3>Add Team Member</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              list="team-member-names"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Select or type a name"
              required
            />
            <datalist id="team-member-names">
              <option value="Miguel Perez Llabata" />
              <option value="Arvin" />
              <option value="Victoria" />
              <option value="Nida Rifda" />
              <option value="Paolo Testa" />
              <option value="Harith Kesavan" />
              <option value="Shruti Patil" />
              <option value="Rithish" />
              <option value="Lisette Maats" />
              <option value="Marco Stefanoni" />
              <option value="Julien" />
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select a role...</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="AI & Automation">AI & Automation</option>
              <option value="Business Development">Business Development</option>
              <option value="Media & Videography">Media & Videography</option>
              <option value="Operations">Operations</option>
              <option value="Investment Impact">Investment Impact</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="avatarUrl">Avatar URL (optional)</label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">Team member added successfully!</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Team Member'}
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="team-members-list">
        <h3>Team Roster</h3>

        {error && <div className="error-message">{error}</div>}

        {teamMembers.length === 0 ? (
          <p className="empty-state">No team members yet. Add one using the form above.</p>
        ) : (
          <div className="members-grid">
            {teamMembers.map((member) => {
              const taskCount = member.tasks?.[0]?.count || 0
              const isExpanded = selectedMemberId === member.id

              return (
                <div key={member.id} className="member-card">
                  {editingMemberId === member.id ? (
                    <div className="edit-member-form">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          list="team-member-names-edit"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Role</label>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                          <option value="">Select a role...</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="AI & Automation">AI & Automation</option>
                          <option value="Business Development">Business Development</option>
                          <option value="Media & Videography">Media & Videography</option>
                          <option value="Operations">Operations</option>
                          <option value="Investment Impact">Investment Impact</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Avatar URL</label>
                        <input
                          type="url"
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                      <div className="edit-actions">
                        <button
                          className="save-btn"
                          onClick={() => handleSaveEdit(member.id)}
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setEditingMemberId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="member-info">
                        <img
                          src={member.avatar_url || '/default-avatar.png'}
                          alt={member.name}
                          className="member-avatar"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%2321262d"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" fill="%2310b981"%3E' + member.name.charAt(0).toUpperCase() + '%3C/text%3E%3C/svg%3E'
                          }}
                        />
                        <div className="member-details">
                          <h4>{member.name}</h4>
                          <p className="member-role">{member.role}</p>
                          <p className="member-tasks">Assigned tasks: {taskCount}</p>
                        </div>
                      </div>

                      <div className="member-actions">
                        <button
                          className="view-tasks-btn"
                          onClick={() => handleViewTasks(member.id)}
                        >
                          {isExpanded ? 'Hide Tasks' : 'View Tasks'}
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => startEditing(member)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(member.id, member.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}

                  {/* Expanded Tasks Section */}
                  {isExpanded && (
                    <div className="member-tasks-section">
                      <h5>Assigned Tasks</h5>
                      {loadingTasks ? (
                        <p>Loading tasks...</p>
                      ) : memberTasks.length === 0 ? (
                        <p className="empty-state">No tasks assigned</p>
                      ) : (
                        <ul className="tasks-list">
                          {memberTasks.map((task) => (
                            <li key={task.id} className="task-item">
                              {editingTaskId === task.id ? (
                                <div className="task-edit-form">
                                  <div className="form-group">
                                    <label>Title</label>
                                    <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} />
                                  </div>
                                  <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #30363d', borderRadius: '6px', background: '#0d1117', color: '#e6edf3', fontSize: '1rem', fontFamily: 'inherit' }} />
                                  </div>
                                  <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} />
                                  </div>
                                  <div className="form-group">
                                    <label>Status</label>
                                    <select value={editTaskStatus} onChange={(e) => setEditTaskStatus(e.target.value as TaskStatus)}>
                                      <option value="backlog">Backlog</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="blocked">Blocked</option>
                                      <option value="done">Done</option>
                                    </select>
                                  </div>
                                  <div className="edit-actions">
                                    <button className="save-btn" onClick={() => handleSaveTask(task.id)} disabled={editTaskSubmitting}>
                                      {editTaskSubmitting ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setEditingTaskId(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="task-header">
                                    <strong>{task.title}</strong>
                                    <span className={`status-badge status-${task.status}`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="task-description">{task.description}</p>
                                  )}
                                  {task.sub_units && (
                                    <p className="task-project">
                                      {task.sub_units.projects?.name} / {task.sub_units.name}
                                    </p>
                                  )}
                                  {task.due_date && (
                                    <p className="task-due-date">Due: {task.due_date}</p>
                                  )}
                                  <div className="task-actions">
                                    <select
                                      className="task-status-select"
                                      value={task.status}
                                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)}
                                    >
                                      <option value="backlog">Backlog</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="blocked">Blocked</option>
                                      <option value="done">Done</option>
                                    </select>
                                    <button className="task-edit-btn" onClick={() => startEditingTask(task)}>Edit</button>
                                    <button className="task-delete-btn" onClick={() => handleDeleteTask(task.id, task.title)}>Delete</button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <datalist id="team-member-names-edit">
        <option value="Miguel Perez Llabata" />
        <option value="Arvin" />
        <option value="Victoria" />
        <option value="Nida Rifda" />
        <option value="Paolo Testa" />
        <option value="Harith Kesavan" />
        <option value="Shruti Patil" />
        <option value="Rithish" />
        <option value="Lisette Maats" />
        <option value="Marco Stefanoni" />
        <option value="Julien" />
      </datalist>

      <style>{`
        .team-members-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .team-members-page h2,
        .team-members-page h3 {
          color: #10b981;
        }

        .add-member-form {
          background: #161b22;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border: 1px solid #30363d;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #8b949e;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #30363d;
          border-radius: 6px;
          font-size: 1rem;
          background: #0d1117;
          color: #e6edf3;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: 2px solid #06b6d4;
          border-color: #06b6d4;
        }

        .error-message {
          color: #f85149;
          background: #490202;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 1rem 0;
          border: 1px solid #f8514933;
        }

        .success-message {
          color: #3fb950;
          background: #0d3117;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 1rem 0;
          border: 1px solid #3fb95033;
        }

        .team-members-page button {
          background: #06b6d4;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .team-members-page button:hover:not(:disabled) {
          background: #0891b2;
        }

        .team-members-page button:disabled {
          background: #21262d;
          color: #6e7681;
          cursor: not-allowed;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .members-grid {
            grid-template-columns: 1fr;
          }
        }

        .member-card {
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 1.5rem;
          background: #161b22;
        }

        .member-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .member-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #30363d;
        }

        .member-details h4 {
          margin: 0 0 0.5rem 0;
          color: #e6edf3;
        }

        .member-role {
          color: #8b949e;
          margin: 0.25rem 0;
        }

        .member-tasks {
          color: #6e7681;
          font-size: 0.9rem;
          margin: 0.25rem 0;
        }

        .member-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .view-tasks-btn {
          flex: 1;
          min-width: 100px;
        }

        .edit-btn {
          background: #d29922 !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.9rem !important;
        }

        .edit-btn:hover:not(:disabled) {
          background: #b8860b !important;
        }

        .delete-btn {
          background: #f85149 !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.9rem !important;
        }

        .delete-btn:hover:not(:disabled) {
          background: #da3633 !important;
        }

        .edit-member-form .form-group {
          margin-bottom: 0.75rem;
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .save-btn {
          background: #10b981 !important;
          flex: 1;
        }

        .save-btn:hover:not(:disabled) {
          background: #059669 !important;
        }

        .cancel-btn {
          background: #21262d !important;
          color: #8b949e !important;
          border: 1px solid #30363d !important;
          flex: 1;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #30363d !important;
        }

        .member-tasks-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #30363d;
        }

        .member-tasks-section h5 {
          margin: 0 0 1rem 0;
          color: #e6edf3;
        }

        .tasks-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .task-item {
          padding: 0.75rem;
          background: #0d1117;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          border: 1px solid #30363d;
        }

        .task-item strong {
          display: inline;
          color: #e6edf3;
        }

        .task-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .task-description {
          font-size: 0.85rem;
          color: #8b949e;
          margin: 0.25rem 0;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .task-status-select {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          border-radius: 4px;
          border: 1px solid #30363d;
          background: #0d1117;
          color: #e6edf3;
          cursor: pointer;
        }

        .task-edit-btn {
          background: #d29922 !important;
          padding: 0.25rem 0.75rem !important;
          font-size: 0.8rem !important;
        }

        .task-edit-btn:hover:not(:disabled) {
          background: #b8860b !important;
        }

        .task-delete-btn {
          background: #f85149 !important;
          padding: 0.25rem 0.75rem !important;
          font-size: 0.8rem !important;
        }

        .task-delete-btn:hover:not(:disabled) {
          background: #da3633 !important;
        }

        .task-edit-form .form-group {
          margin-bottom: 0.5rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 0.5rem;
        }

        .status-backlog {
          background: #21262d;
          color: #8b949e;
        }

        .status-in_progress {
          background: #0c2d6b;
          color: #58a6ff;
        }

        .status-blocked {
          background: #490202;
          color: #f85149;
        }

        .status-done {
          background: #0d3117;
          color: #3fb950;
        }

        .task-project,
        .task-due-date {
          font-size: 0.85rem;
          color: #8b949e;
          margin: 0.25rem 0;
        }

        .empty-state {
          color: #6e7681;
          font-style: italic;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #8b949e;
        }

        @media (max-width: 768px) {
          .team-members-page {
            padding: 1rem;
          }

          .member-info {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .member-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
