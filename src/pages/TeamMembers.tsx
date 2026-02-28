import { useState, FormEvent } from 'react'
import { useTeamMembers } from '../hooks/useTeamMembers'
import { Database } from '../lib/database.types'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  sub_units?: {
    name: string
    projects?: {
      name: string
    }
  }
}

export function TeamMembers() {
  const { teamMembers, loading, error, addTeamMember, getTeamMemberTasks } = useTeamMembers()

  // Form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Selected member state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [memberTasks, setMemberTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

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

      // Clear form on success
      setName('')
      setRole('')
      setAvatarUrl('')
      setFormSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(false), 3000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle member selection and load their tasks
  const handleViewTasks = async (memberId: string) => {
    if (selectedMemberId === memberId) {
      // Collapse if already selected
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team member name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Engineer, Scientist"
              required
            />
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
                  <div className="member-info">
                    <img
                      src={member.avatar_url || '/default-avatar.png'}
                      alt={member.name}
                      className="member-avatar"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" fill="%23999"%3E' + member.name.charAt(0).toUpperCase() + '%3C/text%3E%3C/svg%3E'
                      }}
                    />
                    <div className="member-details">
                      <h4>{member.name}</h4>
                      <p className="member-role">{member.role}</p>
                      <p className="member-tasks">Assigned tasks: {taskCount}</p>
                    </div>
                  </div>

                  <button
                    className="view-tasks-btn"
                    onClick={() => handleViewTasks(member.id)}
                  >
                    {isExpanded ? 'Hide Tasks' : 'View Tasks'}
                  </button>

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
                              <strong>{task.title}</strong>
                              <span className={`status-badge status-${task.status}`}>
                                {task.status}
                              </span>
                              {task.sub_units && (
                                <p className="task-project">
                                  {task.sub_units.projects?.name} / {task.sub_units.name}
                                </p>
                              )}
                              {task.due_date && (
                                <p className="task-due-date">Due: {task.due_date}</p>
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

      <style>{`
        .team-members-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .add-member-form {
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .error-message {
          color: #d32f2f;
          background: #ffebee;
          padding: 0.75rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .success-message {
          color: #388e3c;
          background: #e8f5e9;
          padding: 0.75rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        button {
          background: #1976d2;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #1565c0;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .member-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          background: white;
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
        }

        .member-details h4 {
          margin: 0 0 0.5rem 0;
        }

        .member-role {
          color: #666;
          margin: 0.25rem 0;
        }

        .member-tasks {
          color: #888;
          font-size: 0.9rem;
          margin: 0.25rem 0;
        }

        .view-tasks-btn {
          width: 100%;
          margin-top: 1rem;
        }

        .member-tasks-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .member-tasks-section h5 {
          margin: 0 0 1rem 0;
        }

        .tasks-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .task-item {
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .task-item strong {
          display: block;
          margin-bottom: 0.25rem;
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
          background: #e0e0e0;
          color: #424242;
        }

        .status-in_progress {
          background: #bbdefb;
          color: #0d47a1;
        }

        .status-blocked {
          background: #ffcdd2;
          color: #b71c1c;
        }

        .status-done {
          background: #c8e6c9;
          color: #1b5e20;
        }

        .task-project,
        .task-due-date {
          font-size: 0.85rem;
          color: #666;
          margin: 0.25rem 0;
        }

        .empty-state {
          color: #999;
          font-style: italic;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  )
}
