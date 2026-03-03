import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'
import { theme } from '../lib/theme'

// Import useTeamMembers hook (from plan 01-04)
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useEffect } from 'react'

type TeamMember = Tables<'team_members'>

export function Projects() {
  const { projects, addProject, addSubUnit, updateProjectMembers, loading: projectsLoading, error: projectsError } = useProjects()
  const { tasks, addTask, updateTask, deleteTask, changeStatus, loading: tasksLoading, error: tasksError } = useTasks()

  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [selectedSubUnit, setSelectedSubUnit] = useState<string | null>(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddSubUnit, setShowAddSubUnit] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)

  // Project form state
  const [projectName, setProjectName] = useState('')
  const [projectCodeName, setProjectCodeName] = useState('')
  const [projectMemberIds, setProjectMemberIds] = useState<string[]>([])
  const [projectSubmitting, setProjectSubmitting] = useState(false)

  // Edit members state
  const [editingMembersProjectId, setEditingMembersProjectId] = useState<string | null>(null)
  const [editMemberIds, setEditMemberIds] = useState<string[]>([])

  // Sub-unit form state
  const [subUnitName, setSubUnitName] = useState('')
  const [subUnitDescription, setSubUnitDescription] = useState('')
  const [subUnitSubmitting, setSubUnitSubmitting] = useState(false)

  // Team members for task assignment
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching team members:', error)
        return
      }

      setTeamMembers(data || [])
    }

    fetchTeamMembers()
  }, [])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim() || !projectCodeName.trim()) {
      alert('Please fill in all project fields')
      return
    }

    setProjectSubmitting(true)
    try {
      await addProject(projectName, projectCodeName, projectMemberIds)
      setProjectName('')
      setProjectCodeName('')
      setProjectMemberIds([])
      setShowAddProject(false)
    } catch (err) {
      console.error('Error adding project:', err)
      alert('Failed to add project')
    } finally {
      setProjectSubmitting(false)
    }
  }

  const handleAddSubUnit = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault()

    if (!subUnitName.trim()) {
      alert('Please enter a sub-unit name')
      return
    }

    setSubUnitSubmitting(true)
    try {
      await addSubUnit(projectId, subUnitName, subUnitDescription)
      setSubUnitName('')
      setSubUnitDescription('')
      setShowAddSubUnit(null)
    } catch (err) {
      console.error('Error adding sub-unit:', err)
      alert('Failed to add sub-unit')
    } finally {
      setSubUnitSubmitting(false)
    }
  }

  const handleAddTask = async (subUnitId: string, taskData: any) => {
    try {
      await addTask(
        subUnitId,
        taskData.title,
        taskData.description,
        taskData.assignedTo,
        taskData.dueDate,
        taskData.status
      )
      setShowAddTask(null)
    } catch (err) {
      console.error('Error adding task:', err)
      throw err
    }
  }

  const handleEditTask = async (taskId: string, updates: any) => {
    try {
      await updateTask(taskId, updates)
    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: any) => {
    try {
      await changeStatus(taskId, newStatus)
    } catch (err) {
      console.error('Error changing status:', err)
      throw err
    }
  }

  const toggleMemberId = (id: string, list: string[], setter: (ids: string[]) => void) => {
    setter(list.includes(id) ? list.filter(m => m !== id) : [...list, id])
  }

  const handleSaveProjectMembers = async (projectId: string) => {
    try {
      await updateProjectMembers(projectId, editMemberIds)
      setEditingMembersProjectId(null)
    } catch (err) {
      console.error('Error updating project members:', err)
    }
  }

  const getTasksForSubUnit = (subUnitId: string) => {
    return tasks.filter(task => task.sub_unit_id === subUnitId)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px' }
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: theme.textSecondary }

  if (projectsLoading && projects.length === 0) {
    return <div style={{ padding: '20px', color: theme.textSecondary }}>Loading projects...</div>
  }

  if (projectsError) {
    return <div style={{ padding: '20px', color: theme.error }}>Error: {projectsError}</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, color: theme.green }}>Projects</h1>
        <button
          onClick={() => setShowAddProject(!showAddProject)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: theme.green,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {showAddProject ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {showAddProject && (
        <form onSubmit={handleAddProject} style={{ marginBottom: '30px', padding: '20px', border: `2px solid ${theme.green}`, borderRadius: '8px', backgroundColor: theme.bgSurface }}>
          <h3 style={{ marginTop: 0, color: theme.text }}>Add New Project</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Project Name *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="e.g., Seraph - Duckweed Growing System"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Code Name *</label>
            <input
              type="text"
              value={projectCodeName}
              onChange={(e) => setProjectCodeName(e.target.value)}
              required
              placeholder="e.g., SERAPH"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Team Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {teamMembers.map(member => (
                <label
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: projectMemberIds.includes(member.id) ? `2px solid ${theme.green}` : `1px solid ${theme.border}`,
                    backgroundColor: projectMemberIds.includes(member.id) ? theme.greenBg : theme.bgElevated,
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: projectMemberIds.includes(member.id) ? theme.green : theme.textSecondary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={projectMemberIds.includes(member.id)}
                    onChange={() => toggleMemberId(member.id, projectMemberIds, setProjectMemberIds)}
                    style={{ display: 'none' }}
                  />
                  {member.name}
                  <span style={{ color: theme.textMuted, fontSize: '11px' }}>{member.role}</span>
                </label>
              ))}
            </div>
            {projectMemberIds.length > 0 && (
              <p style={{ margin: '5px 0 0', fontSize: '12px', color: theme.textMuted }}>
                {projectMemberIds.length} member{projectMemberIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={projectSubmitting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: projectSubmitting ? theme.bgElevated : theme.green,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: projectSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {projectSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: theme.bgSurface, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
          <p style={{ fontSize: '18px', color: theme.textSecondary }}>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div>
          {projects.map(project => {
            // Filter team members to only those assigned to this project
            const projectMemberIdSet = new Set(project.project_members?.map(pm => pm.team_member_id) || [])
            const projectTeamMembers = projectMemberIdSet.size > 0
              ? teamMembers.filter(m => projectMemberIdSet.has(m.id))
              : teamMembers

            return (
            <div key={project.id} style={{ marginBottom: '30px', border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              {/* Project Header */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: theme.bgSurface,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              >
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 5px 0', color: theme.text }}>
                    {project.name} <span style={{ color: theme.textMuted, fontSize: '16px' }}>({project.code_name})</span>
                  </h2>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: theme.textSecondary }}>
                    {project.sub_units?.length || 0} sub-units
                  </p>
                  {project.project_members && project.project_members.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {project.project_members.map(pm => (
                        <span key={pm.id} style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: theme.cyanBg,
                          fontSize: '11px',
                          color: theme.cyan,
                        }}>
                          {pm.team_members?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '24px', color: theme.textMuted }}>
                  {expandedProject === project.id ? '\u25BC' : '\u25B6'}
                </span>
              </div>

              {/* Project Content */}
              {expandedProject === project.id && (
                <div style={{ padding: '20px', backgroundColor: theme.bg }}>
                  {/* Edit Project Members */}
                  <div style={{ marginBottom: '20px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (editingMembersProjectId === project.id) {
                          setEditingMembersProjectId(null)
                        } else {
                          setEditingMembersProjectId(project.id)
                          setEditMemberIds(project.project_members?.map(pm => pm.team_member_id) || [])
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: theme.purple,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {editingMembersProjectId === project.id ? 'Cancel' : 'Edit Members'}
                    </button>

                    {editingMembersProjectId === project.id && (
                      <div style={{ marginTop: '10px', padding: '15px', border: `2px solid ${theme.purple}`, borderRadius: '8px', backgroundColor: theme.bgSurface }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          {teamMembers.map(member => (
                            <label
                              key={member.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: editMemberIds.includes(member.id) ? `2px solid ${theme.purple}` : `1px solid ${theme.border}`,
                                backgroundColor: editMemberIds.includes(member.id) ? theme.purpleBg : theme.bgElevated,
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: editMemberIds.includes(member.id) ? theme.purple : theme.textSecondary,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={editMemberIds.includes(member.id)}
                                onChange={() => toggleMemberId(member.id, editMemberIds, setEditMemberIds)}
                                style={{ display: 'none' }}
                              />
                              {member.name}
                              <span style={{ color: theme.textMuted, fontSize: '11px' }}>{member.role}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSaveProjectMembers(project.id)}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            backgroundColor: theme.purple,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Save Members
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: theme.text }}>Sub-Units</h3>
                    <button
                      onClick={() => setShowAddSubUnit(showAddSubUnit === project.id ? null : project.id)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        backgroundColor: theme.cyan,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {showAddSubUnit === project.id ? 'Cancel' : '+ Add Sub-Unit'}
                    </button>
                  </div>

                  {showAddSubUnit === project.id && (
                    <form onSubmit={(e) => handleAddSubUnit(e, project.id)} style={{ marginBottom: '20px', padding: '15px', border: `2px solid ${theme.cyan}`, borderRadius: '8px', backgroundColor: theme.bgSurface }}>
                      <h4 style={{ marginTop: 0, color: theme.text }}>Add New Sub-Unit</h4>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Sub-Unit Name *</label>
                        <input
                          type="text"
                          value={subUnitName}
                          onChange={(e) => setSubUnitName(e.target.value)}
                          required
                          placeholder="e.g., Simulation"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                          value={subUnitDescription}
                          onChange={(e) => setSubUnitDescription(e.target.value)}
                          placeholder="e.g., Growth simulation modeling"
                          rows={2}
                          style={inputStyle}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={subUnitSubmitting}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: subUnitSubmitting ? theme.bgElevated : theme.cyan,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: subUnitSubmitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {subUnitSubmitting ? 'Creating...' : 'Create Sub-Unit'}
                      </button>
                    </form>
                  )}

                  {!project.sub_units || project.sub_units.length === 0 ? (
                    <p style={{ color: theme.textMuted, fontStyle: 'italic' }}>No sub-units yet. Add one to get started!</p>
                  ) : (
                    <div>
                      {project.sub_units.map(subUnit => (
                        <div key={subUnit.id} style={{ marginBottom: '20px', border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Sub-Unit Header */}
                          <div
                            style={{
                              padding: '15px',
                              backgroundColor: theme.bgSurface,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => setSelectedSubUnit(selectedSubUnit === subUnit.id ? null : subUnit.id)}
                          >
                            <div>
                              <h4 style={{ margin: '0 0 5px 0', color: theme.text }}>{subUnit.name}</h4>
                              {subUnit.description && (
                                <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: theme.textSecondary }}>{subUnit.description}</p>
                              )}
                              <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>
                                {subUnit.task_count || 0} tasks
                              </p>
                            </div>
                            <span style={{ fontSize: '18px', color: theme.textMuted }}>
                              {selectedSubUnit === subUnit.id ? '\u25BC' : '\u25B6'}
                            </span>
                          </div>

                          {/* Sub-Unit Content (Tasks) */}
                          {selectedSubUnit === subUnit.id && (
                            <div style={{ padding: '15px', backgroundColor: theme.bg }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '8px' }}>
                                <h4 style={{ margin: 0, color: theme.text }}>Tasks</h4>
                                <button
                                  onClick={() => setShowAddTask(showAddTask === subUnit.id ? null : subUnit.id)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    backgroundColor: theme.warning,
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {showAddTask === subUnit.id ? 'Cancel' : '+ Add Task'}
                                </button>
                              </div>

                              {showAddTask === subUnit.id && (
                                <div style={{ marginBottom: '20px' }}>
                                  <TaskForm
                                    onSubmit={(taskData) => handleAddTask(subUnit.id, taskData)}
                                    teamMembers={projectTeamMembers}
                                    onCancel={() => setShowAddTask(null)}
                                  />
                                </div>
                              )}

                              {getTasksForSubUnit(subUnit.id).length === 0 ? (
                                <p style={{ color: theme.textMuted, fontStyle: 'italic', margin: 0 }}>No tasks yet. Add one to get started!</p>
                              ) : (
                                <div>
                                  {getTasksForSubUnit(subUnit.id).map(task => (
                                    <TaskCard
                                      key={task.id}
                                      task={task}
                                      teamMembers={projectTeamMembers}
                                      onEdit={handleEditTask}
                                      onDelete={handleDeleteTask}
                                      onStatusChange={handleStatusChange}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
