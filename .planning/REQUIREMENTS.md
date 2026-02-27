# Requirements: Ex-Venture Engineering Team Tracker v2

**Defined:** 2026-02-27
**Core Value:** The spiderweb visualization is the live window into the whole system — zoom from company → project → sub-unit → task → file, with team members mapped at every level, fed by real-time data.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Team

- [ ] **AUTH-01**: User can sign in with email/password via Supabase Auth
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can sign out from any page
- [ ] **TEAM-01**: Admin can add team members with name, role, avatar
- [ ] **TEAM-02**: User can view team member list with roles
- [ ] **TEAM-03**: User can view individual team member's assigned tasks

### Data Model

- [ ] **DATA-01**: System supports hierarchical structure: Company → Project → Sub-unit → Task
- [ ] **DATA-02**: User can create project with name, code name, team assignment
- [ ] **DATA-03**: User can create sub-unit under a project
- [ ] **DATA-04**: User can create task with title, description, assignee, due date, status
- [ ] **DATA-05**: User can edit task details
- [ ] **DATA-06**: User can delete task
- [ ] **DATA-07**: User can assign task to team member
- [ ] **DATA-08**: User can reassign task to different team member

### Spiderweb Visualization

- [ ] **VIZ-01**: User can view force-directed graph showing company → project → sub-unit hierarchy
- [ ] **VIZ-02**: User can click on project node to zoom into sub-units
- [ ] **VIZ-03**: User can click on sub-unit node to zoom into tasks
- [ ] **VIZ-04**: User can navigate back up hierarchy via breadcrumb
- [ ] **VIZ-05**: Nodes display team members assigned at that level
- [ ] **VIZ-06**: Nodes show visual state (solid = complete, pulsing = active, outline = pending)
- [ ] **VIZ-07**: Hover on node shows tooltip with last update and owner
- [ ] **VIZ-08**: Nodes are color-coded by team (green = Science, purple = AI, cyan = crossover)

### Alternative Views

- [ ] **VIEW-01**: User can switch to list view showing all tasks
- [ ] **VIEW-02**: User can switch to board view (Kanban columns by status)
- [ ] **VIEW-03**: User can filter by project
- [ ] **VIEW-04**: User can filter by team member

### Status & Workflow

- [ ] **STATUS-01**: Task has status: backlog, in_progress, blocked, done
- [ ] **STATUS-02**: User can change task status via dropdown
- [ ] **STATUS-03**: Status changes are reflected in real-time across all connected clients

### Real-time Updates

- [ ] **RT-01**: Dashboard updates in real-time when another user makes changes
- [ ] **RT-02**: Spiderweb visualization reflects changes without page refresh
- [ ] **RT-03**: Real-time connection indicator shows sync status

### Slack Integration (Basic)

- [ ] **SLACK-01**: System posts notification to Slack when task is created
- [ ] **SLACK-02**: System posts notification to Slack when task is assigned
- [ ] **SLACK-03**: System posts notification to Slack when task is completed
- [ ] **SLACK-04**: Notifications include task title, assignee, and link to tracker

### UI/UX

- [ ] **UI-01**: Dashboard is mobile responsive (works on phones and tablets)
- [ ] **UI-02**: EX Venture brand theme (dark background, green/purple/cyan accents)
- [ ] **UI-03**: Loading states for async operations
- [ ] **UI-04**: Error handling with user-friendly messages

### Security

- [ ] **SEC-01**: All API endpoints require authentication
- [ ] **SEC-02**: Row-level security in Supabase restricts data to authenticated users
- [ ] **SEC-03**: Slack webhook has authentication token
- [ ] **SEC-04**: Environment variables stored securely in Vercel

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### NLP-Powered Slack Bot

- **NLP-01**: Bot monitors engineering group chat for task-like messages
- **NLP-02**: Bot uses AI to extract task details (who, what, project, due date)
- **NLP-03**: Bot asks for confirmation before creating task
- **NLP-04**: Bot supports confidence threshold configuration

### Bidirectional Slack Integration

- **SLACK-05**: User can update task status from Slack
- **SLACK-06**: User can add comments to tasks from Slack
- **SLACK-07**: User can create tasks via slash command

### Advanced Visualization

- **VIZ-09**: Semantic zoom (different detail levels based on zoom)
- **VIZ-10**: Task dependencies with visual links
- **VIZ-11**: Drag-and-drop node rearrangement

### Workload Management

- **WORK-01**: Visual workload heatmap with color coding
- **WORK-02**: Drag-and-drop task reassignment from heatmap
- **WORK-03**: Capacity tracking per team member

### Archive & Reporting

- **ARCH-01**: Weekly archive snapshots of project state
- **ARCH-02**: Monthly archive snapshots
- **ARCH-03**: Time-travel view to see past state
- **RPT-01**: Completion rate dashboard
- **RPT-02**: Velocity trends over time

### AI Agent Sync (v2+)

- **AGENT-01**: OpenClaw agents can authenticate via API key
- **AGENT-02**: Agents can read project/task data via API
- **AGENT-03**: Agents can create/update tasks via API
- **AGENT-04**: Bidirectional sync between tracker and Mac mini agents
- **AGENT-05**: Conflict resolution for concurrent human/agent edits

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat within tracker | Chat dilutes focus, duplicates Slack |
| Time tracking with timers | Creates surveillance culture, engineers hate it |
| Granular per-task permissions | Complexity explosion, internal team doesn't need |
| Gantt charts | Engineering work is exploratory, Gantt outdated instantly |
| Custom workflows per project | Configuration nightmare, stay opinionated |
| Budgeting/financial tracking | Scope creep into finance domain |
| Video/voice calls | Duplicates Slack huddles, Zoom |
| Email notifications | Notification fatigue, use Slack |
| Mobile native app | Web-first, defer native apps |
| Multi-workspace support | Internal team tool for one company |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| TEAM-01 | Phase 1 | Pending |
| TEAM-02 | Phase 1 | Pending |
| TEAM-03 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DATA-06 | Phase 1 | Pending |
| DATA-07 | Phase 1 | Pending |
| DATA-08 | Phase 1 | Pending |
| STATUS-01 | Phase 1 | Pending |
| STATUS-02 | Phase 1 | Pending |
| VIZ-01 | Phase 3 | Pending |
| VIZ-02 | Phase 3 | Pending |
| VIZ-03 | Phase 3 | Pending |
| VIZ-04 | Phase 3 | Pending |
| VIZ-05 | Phase 3 | Pending |
| VIZ-06 | Phase 3 | Pending |
| VIZ-07 | Phase 3 | Pending |
| VIZ-08 | Phase 3 | Pending |
| VIEW-01 | Phase 2 | Pending |
| VIEW-02 | Phase 2 | Pending |
| VIEW-03 | Phase 2 | Pending |
| VIEW-04 | Phase 2 | Pending |
| STATUS-03 | Phase 2 | Pending |
| RT-01 | Phase 2 | Pending |
| RT-02 | Phase 2 | Pending |
| RT-03 | Phase 2 | Pending |
| SLACK-01 | Phase 4 | Pending |
| SLACK-02 | Phase 4 | Pending |
| SLACK-03 | Phase 4 | Pending |
| SLACK-04 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 4 | Pending |
| SEC-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-28 after roadmap creation*
