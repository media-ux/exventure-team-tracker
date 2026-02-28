import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskForm } from '../components/TaskForm'

// Import useTeamMembers hook (from plan 01-04)
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useEffect } from 'react'

type TeamMember = Tables<'team_members'>

export function Projects() {
  const { projects, addProject, addSubUnit, loading: projectsLoading, error: projectsError } = useProjects()
  const { tasks, addTask, updateTask, deleteTask, changeStatus, loading: tasksLoading, error: tasksError } = useTasks()

  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [selectedSubUnit, setSelectedSubUnit] = useState<string | null>(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddSubUnit, setShowAddSubUnit] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState<string | null>(null)

  // Project form state
  const [projectName, setProjectName] = useState('')
  const [projectCodeName, setProjectCodeName] = useState('')
  const [projectSubmitting, setProjectSubmitting] = useState(false)

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
      await addProject(projectName, projectCodeName)
      setProjectName('')
      setProjectCodeName('')
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

  const getTasksForSubUnit = (subUnitId: string) => {
    return tasks.filter(task => task.sub_unit_id === subUnitId)
  }

  if (projectsLoading && projects.length === 0) {
    return <div style={{ padding: '20px' }}>Loading projects...</div>
  }

  if (projectsError) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {projectsError}</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <button
          onClick={() => setShowAddProject(!showAddProject)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAddProject ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {showAddProject && (
        <form onSubmit={handleAddProject} style={{ marginBottom: '30px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Add New Project</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Project Name *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="e.g., Seraph - Duckweed Growing System"
              style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Code Name *
            </label>
            <input
              type="text"
              value={projectCodeName}
              onChange={(e) => setProjectCodeName(e.target.value)}
              required
              placeholder="e.g., SERAPH"
              style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <button
            type="submit"
            disabled={projectSubmitting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: projectSubmitting ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: projectSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {projectSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div>
          {projects.map(project => (
            <div key={project.id} style={{ marginBottom: '30px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
              {/* Project Header */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              >
                <div>
                  <h2 style={{ margin: '0 0 5px 0' }}>
                    {project.name} <span style={{ color: '#666', fontSize: '16px' }}>({project.code_name})</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    {project.sub_units?.length || 0} sub-units
                  </p>
                </div>
                <span style={{ fontSize: '24px' }}>
                  {expandedProject === project.id ? '▼' : '▶'}
                </span>
              </div>

              {/* Project Content */}
              {expandedProject === project.id && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Sub-Units</h3>
                    <button
                      onClick={() => setShowAddSubUnit(showAddSubUnit === project.id ? null : project.id)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        backgroundColor: '#2196F3',
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
                    <form onSubmit={(e) => handleAddSubUnit(e, project.id)} style={{ marginBottom: '20px', padding: '15px', border: '2px solid #2196F3', borderRadius: '4px' }}>
                      <h4 style={{ marginTop: 0 }}>Add New Sub-Unit</h4>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Sub-Unit Name *
                        </label>
                        <input
                          type="text"
                          value={subUnitName}
                          onChange={(e) => setSubUnitName(e.target.value)}
                          required
                          placeholder="e.g., Simulation"
                          style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Description
                        </label>
                        <textarea
                          value={subUnitDescription}
                          onChange={(e) => setSubUnitDescription(e.target.value)}
                          placeholder="e.g., Growth simulation modeling"
                          rows={2}
                          style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={subUnitSubmitting}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: subUnitSubmitting ? '#ccc' : '#2196F3',
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
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No sub-units yet. Add one to get started!</p>
                  ) : (
                    <div>
                      {project.sub_units.map(subUnit => (
                        <div key={subUnit.id} style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                          {/* Sub-Unit Header */}
                          <div
                            style={{
                              padding: '15px',
                              backgroundColor: '#fafafa',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => setSelectedSubUnit(selectedSubUnit === subUnit.id ? null : subUnit.id)}
                          >
                            <div>
                              <h4 style={{ margin: '0 0 5px 0' }}>{subUnit.name}</h4>
                              {subUnit.description && (
                                <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>{subUnit.description}</p>
                              )}
                              <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                                {subUnit.task_count || 0} tasks
                              </p>
                            </div>
                            <span style={{ fontSize: '18px' }}>
                              {selectedSubUnit === subUnit.id ? '▼' : '▶'}
                            </span>
                          </div>

                          {/* Sub-Unit Content (Tasks) */}
                          {selectedSubUnit === subUnit.id && (
                            <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0 }}>Tasks</h4>
                                <button
                                  onClick={() => setShowAddTask(showAddTask === subUnit.id ? null : subUnit.id)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    backgroundColor: '#FF9800',
                                    color: 'white',
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
                                    teamMembers={teamMembers}
                                    onCancel={() => setShowAddTask(null)}
                                  />
                                </div>
                              )}

                              {getTasksForSubUnit(subUnit.id).length === 0 ? (
                                <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>No tasks yet. Add one to get started!</p>
                              ) : (
                                <div>
                                  {getTasksForSubUnit(subUnit.id).map(task => (
                                    <TaskCard
                                      key={task.id}
                                      task={task}
                                      teamMembers={teamMembers}
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
          ))}
        </div>
      )}
    </div>
  )
}
