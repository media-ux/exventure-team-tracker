# Roadmap: Ex-Venture Engineering Team Tracker v2

## Overview

This roadmap delivers a distributed intelligence system unifying Slack communication, zoomable spiderweb visualization, and real-time team tracking. The journey progresses from foundational data architecture through interactive visualization to external integrations and production deployment. Each phase builds upon the previous, establishing patterns before adding complexity, culminating in a production-ready internal team tool with distinctive spiderweb visualization fed by live Slack data.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Layer** - Schema-first Supabase setup with auth, team management, and hierarchical data model ✓
- [x] **Phase 2: Core Dashboard & Real-time** - Basic task views with real-time subscriptions and CRUD operations ✓
- [ ] **Phase 3: Spiderweb Visualization** - Flagship force-directed graph with zoomable hierarchy and team mapping
- [ ] **Phase 4: Slack Integration** - Outbound notifications and step-by-step bot deployment guide
- [ ] **Phase 5: Production Polish & Deployment** - Mobile polish, EX Venture branding, security hardening, and Vercel deployment

## Phase Details

### Phase 1: Foundation & Data Layer
**Goal**: Establish single source of truth with authentication, team management, and complete hierarchical data schema before any UI work
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, TEAM-01, TEAM-02, TEAM-03, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, STATUS-01, STATUS-02, SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. User can sign in with email/password and session persists across browser refresh
  2. User can sign out from any page
  3. Admin can add team members with name, role, and avatar
  4. User can view team member list with roles and individual assignments
  5. User can create projects with code names, sub-units under projects, and tasks with full metadata (title, description, assignee, due date, status)
  6. User can edit task details, delete tasks, and reassign to different team members
  7. Task status can be changed via dropdown (backlog, in_progress, blocked, done)
  8. All API endpoints require authentication and row-level security restricts data to authenticated users
**Plans**: 5 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md — Project scaffold and Supabase client setup ✓
- [x] 01-02-PLAN.md — Database schema with RLS policies ✓
- [x] 01-03-PLAN.md — Authentication with session persistence ✓
- [x] 01-04-PLAN.md — Team member management ✓
- [x] 01-05-PLAN.md — Hierarchical data CRUD (Projects → Sub-units → Tasks) ✓

### Phase 2: Core Dashboard & Real-time
**Goal**: Validate data layer with functional UI showing real-time updates across list and board views
**Depends on**: Phase 1
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, STATUS-03, RT-01, RT-02, RT-03, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. User can switch between list view and board view (Kanban columns by status)
  2. User can filter tasks by project and by team member
  3. Dashboard updates in real-time when another user makes changes (no page refresh needed)
  4. Spiderweb visualization reflects changes without page refresh
  5. Real-time connection indicator shows sync status (connected/disconnected)
  6. Loading states appear during async operations
  7. Error messages are user-friendly when operations fail
**Plans**: 5 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md — Dependencies and real-time infrastructure (Wave 1) ✓
- [x] 02-02-PLAN.md — Loading and error handling components (Wave 1) ✓
- [x] 02-03-PLAN.md — List view with filters (Wave 2) ✓
- [x] 02-04-PLAN.md — Board view with drag-and-drop (Wave 2) ✓
- [x] 02-05-PLAN.md — TaskBoard integration with real-time (Wave 3) ✓

### Phase 3: Spiderweb Visualization
**Goal**: Deliver flagship force-directed graph with zoomable hierarchy, team member mapping, and interactive exploration
**Depends on**: Phase 2
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05, VIZ-06, VIZ-07, VIZ-08
**Success Criteria** (what must be TRUE):
  1. User can view force-directed graph showing company → project → sub-unit hierarchy
  2. User can click on project node to zoom into sub-units
  3. User can click on sub-unit node to zoom into tasks
  4. User can navigate back up hierarchy via breadcrumb trail
  5. Nodes display team members assigned at that level
  6. Nodes show visual state (solid = complete, pulsing = active, outline = pending)
  7. Hover on node shows tooltip with last update and owner
  8. Nodes are color-coded by team (green = Science, purple = AI, cyan = crossover)
**Plans**: 3 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Force graph foundation with static layout ✓
- [ ] 03-02-PLAN.md — Visual design and node styling
- [ ] 03-03-PLAN.md — Navigation and page integration

### Phase 4: Slack Integration
**Goal**: Connect tracker to Slack with outbound notifications and provide step-by-step bot deployment guide for user
**Depends on**: Phase 2
**Requirements**: SLACK-01, SLACK-02, SLACK-03, SLACK-04, SEC-03
**Success Criteria** (what must be TRUE):
  1. System posts notification to Slack when task is created
  2. System posts notification to Slack when task is assigned
  3. System posts notification to Slack when task is completed
  4. Notifications include task title, assignee, and clickable link to tracker
  5. Slack webhook has authentication token configured
  6. User has step-by-step guide to deploy Slack bot to workspace (no assumptions about prior knowledge)
**Plans**: 4 plans in 1 wave

Plans:
- [x] 04-01-PLAN.md — Edge Function for Slack notifications (slack-notify) ✓
- [x] 04-02-PLAN.md — Database triggers via pg_net ✓
- [x] 04-03-PLAN.md — Slack setup guide and Settings page ✓
- [x] 04-04-PLAN.md — Planning docs update ✓

### Phase 5: Production Polish & Deployment
**Goal**: Harden application for production use with mobile responsiveness, EX Venture branding, and secure Vercel deployment
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, SEC-04
**Success Criteria** (what must be TRUE):
  1. Dashboard is fully responsive on phones and tablets
  2. EX Venture brand theme applied (dark background, green/purple/cyan accents per team)
  3. Environment variables stored securely in Vercel
  4. Application deployed to Vercel with custom domain
  5. All security headers configured (HTTPS, CSP, CORS)
**Plans**: TBD

Plans:
- TBD (to be defined during phase planning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 5/5 | Complete | 2026-02-28 |
| 2. Core Dashboard & Real-time | 5/5 | Complete | 2026-03-01 |
| 3. Spiderweb Visualization | 1/3 | In progress | - |
| 4. Slack Integration | 4/4 | Complete | 2026-03-02 |
| 5. Production Polish & Deployment | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-28*
*Last updated: 2026-03-02 (Phase 4 complete)*
