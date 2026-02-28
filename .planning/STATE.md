# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The spiderweb visualization is the live window into the whole system — zoom from company → project → sub-unit → task → file, with team members mapped at every level, fed by real-time data from Slack and OpenClaw agents.
**Current focus:** Phase 1 - Foundation & Data Layer

## Current Position

Phase: 1 of 5 (Foundation & Data Layer)
Current Plan: 3 of 5
Status: In progress
Last activity: 2026-02-28 — Completed plan 01-03: Email/password authentication

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 11 minutes
- Total execution time: 0.55 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Data Layer | 3 | 33 min | 11 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (16 min), 01-03 (13 min)
- Trend: Consistent velocity, auth phase faster than schema work

*Updated after each plan completion*
| Phase 01 P02 | 16 | 3 tasks | 3 files |
| Phase 01 P03 | 13 | 3 tasks | 6 files |
| Phase 01-foundation-data-layer P04 | 12 | 3 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Schema-first approach: Prevents drift between Spiderweb UI, Slack bot, and OpenClaw agents
- Supabase for backend: Real-time subscriptions, auto-generated API, free tier
- D3.js for spiderweb: Industry standard for force-directed graphs, SVG-based
- Step-by-step Slack guide: User needs guidance, not assumptions about knowledge
- Singleton pattern for Supabase client (01-01): Ensures single instance across app, reduces memory overhead
- Keep @supabase/auth-helpers-react despite deprecation (01-01): Currently in STACK.md, migration to @supabase/ssr deferred to future phase
- [Phase 01-02]: CASCADE delete for hierarchical relationships (project deletion cascades to sub-units and tasks)
- [Phase 01-02]: SET NULL for assigned_to FK (team member deletion unassigns tasks without data loss)
- [Phase 01-02]: Wrapped auth.uid() in SELECT subquery for RLS policy performance (query caching)
- [Phase 01-02]: Created indexes on all FK columns (critical for RLS performance per research)
- [Phase 01-03]: Used Pattern 2 from research for session management (getSession() before onAuthStateChange to avoid session persistence pitfall)
- [Phase 01-03]: Configured .env.local with local Supabase credentials for local development and testing
- [Phase 01-04]: Hardcoded company_id (00000000-0000-0000-0000-000000000001) for single-company MVP
- [Phase 01-04]: All team members linked to test@example.com user in development (simplifies RLS)
- [Phase 01-04]: Create test auth user programmatically in seed.sql for automated setup
- [Phase 01-04]: Inline styles in TeamMembers page for rapid MVP (refactor to CSS modules later)

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

None yet.

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 01-02-PLAN.md (Database schema and RLS)
Resume file: None
