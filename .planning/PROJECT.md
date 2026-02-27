# Ex-Venture Engineering Team Tracker v2

## What This Is

A distributed intelligence system that unifies human communication (Slack), visual dashboards (zoomable spiderweb), and AI agents (OpenClaw on Mac minis) into a single coherent workflow. The tracker serves as both a team visibility tool and a shared memory layer for humans and AI agents.

## Core Value

**The spiderweb visualization is the live window into the whole system** — zoom from company → project → sub-unit → task → file, with team members mapped at every level, fed by real-time data from Slack and OpenClaw agents.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Zoomable spiderweb visualization (company → project → sub-unit → task)
- [ ] Team member mapping at every level of the hierarchy
- [ ] Supabase backend with unified data schema
- [ ] Slack bot that processes group chat messages into structured data
- [ ] Bidirectional sync with OpenClaw agents on Mac minis
- [ ] Weekly/monthly progress views (better than Slack's task tracker)
- [ ] Secure Vercel deployment with authentication
- [ ] Beautiful frontend with EX Venture brand theme

### Out of Scope

- Mobile native app — web-first, mobile later
- Real-time chat within tracker — Slack handles communication
- Video/voice features — not core to tracking
- Public access — internal team tool only

## Context

**Team Structure:**
- Science Team: Miguel (lead), Arvin, Victoria
- AI & Automation Team: Nida (IntelliBot lead), Paolo, Harith, Shruti, Rithish, Miguel (crossover)
- Unassigned: Lisette, Marco

**Active Projects:**
- Seraph (duckweed growing system) — sub-units: Simulation, Pilot Farm, Lit Validation, Presets
- X150 (waste to energy) — sub-units: CFD, Oil Bath Drier
- IntelliBot/OpenClaw (AI orchestration) — sub-units: GSD Integration, PnP, A2A, Toon

**Existing Infrastructure:**
- OpenClaw agents running 24/7 on Mac minis (one per project: Seraph, X150)
- Each agent has structured database and file system (needs improvement)
- CONTEXT.md + IDEAS.md as current persistent memory
- GSD-Command-Centre.html (v1 tracker, localStorage only)
- Slack workspace with bot capability (user needs deployment guidance)

**Current Pain Points:**
- localStorage is per-device, not shared
- No automatic ingestion from team communication
- No real-time updates to OpenClaw agents
- Completed tasks linger in Slack's ugly task tracker

## Constraints

- **Tech Stack**: React + Vite + D3.js + Tailwind + shadcn/ui + Supabase — proven stack with free tiers
- **Hosting**: Vercel — easy deploy, edge functions, free tier
- **Slack**: User doesn't know bot deployment — needs step-by-step guidance
- **OpenClaw**: File structure on Mac minis needs improvement before full integration
- **Security**: Internal team tool — needs auth but not enterprise-grade

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Schema-first approach | Prevents drift between Spiderweb UI, Slack bot, and OpenClaw agents | — Pending |
| Supabase for backend | Real-time subscriptions, auto-generated API, free tier | — Pending |
| D3.js for spiderweb | Industry standard for force-directed graphs, SVG-based | — Pending |
| Parallel tracks (UI + Bot + Agents) | Faster overall, components can be built independently | — Pending |
| Step-by-step Slack guide | User needs guidance, not assumptions about knowledge | — Pending |

---
*Last updated: 2026-02-27 after brainstorming session*
