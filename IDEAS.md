# Ex-Venture Operations — Ideas & Roadmap

> Brainstorm log. Everything here is either queued, in consideration, or needs a decision.
> Status: 💡 Idea | 🔄 In Progress | ✅ Done | ❌ Dropped

---

## ⚠️ Naming Clarification (2026-02-27)

**GSD** is Miguel's personal productivity repo/workflow system — not the name of the team tracker or this project.
- "GSD" = a tool/repo Miguel uses to get shit done
- `/gsd:new-project`, `/gsd:weekly-report` etc. = commands *within* the GSD repo
- The tracker we're building = **Ex-Venture Engineering Team Tracker**
- Goal: The tracker hooks *into* GSD (Miguel's repo), not the other way around

---

## 🗺️ Dependency Map — ExOps v2

What we need before we can build each major feature.

### Layer 1 — Data Persistence (blocker for everything)
| Dependency | Current State | What's needed |
|---|---|---|
| Data store | localStorage (per device, not shared) | Supabase (shared, real-time, free tier) OR GitHub JSON file as backend |
| Schema | Flat log array in HTML | Tables: `members`, `projects`, `phases`, `logs`, `ideas` |
| API | None | Supabase REST auto-generated OR FastAPI thin wrapper |

**Decision needed:** Supabase (easiest, real-time) vs GitHub JSON (no infra) vs self-hosted (on same server as IntelliBot)?

### Layer 2 — Deployment (needed for team access)
| Dependency | What's needed |
|---|---|
| Vercel account | Miguel to connect GitHub repo |
| GitHub repo | New repo: `exventure-ops` (or add to existing GSD repo) |
| Environment variables | Supabase URL + anon key in Vercel env |
| Domain | Optional: ops.exventure.co or similar |

### Layer 3 — Frontend Rebuild (needed for spiderweb + mobile)
| Dependency | What's needed | Available skill |
|---|---|---|
| React + Vite | Scaffold new app | `web-artifacts-builder` ✅ |
| D3.js force graph | Spiderweb viz component | D3 via CDN or npm |
| Tailwind CSS | Design system | Included in web-artifacts-builder ✅ |
| Theme / brand | EX colour palette | `theme-factory` ✅ |
| shadcn/ui | Component library | Included in web-artifacts-builder ✅ |

### Layer 4 — OpenClaw / IntelliBot Integration
| Dependency | What's needed | Who owns it |
|---|---|---|
| Webhook endpoint | POST `/api/log` for agent to push updates | Nida (IntelliBot side) + Miguel (ExOps side) |
| API schema | Agreed JSON format for task events | Joint: Nida + Miguel |
| Auth token | Shared secret for agent → dashboard calls | Nida |
| Read endpoint | GET `/api/projects` so agents know current state | Miguel |

### Layer 5 — GSD Repo Integration
| Dependency | What's needed |
|---|---|
| GSD repo access | Miguel to share/link |
| `/gsd:new-project` command | Prompts → writes to CONTEXT.md + Supabase |
| `/gsd:weekly-report` command | Pulls logs → generates PDF summary |
| `/brainstorm` command | Structured ideation → appends to IDEAS.md |

**Skills available to build these:** `skill-creator` ✅, `mcp-builder` ✅, `schedule` ✅

---

---

## GSD v2 — Next Major Build

#---

## 🧠 BRAINSTORM SESSION — 2026-02-27

*Structured ideation on the Engineering Team Tracker v2. All ideas captured as-is.*

---

## 🕸️ Spiderweb / Mind Map Visualisation
**Status:** 💡 Idea
**Priority:** HIGH — flagship v2 feature

**Concept:** The whole project ecosystem, visible at a glance as a live force-directed graph. This is both the homepage and the navigation.

**Graph structure:**
```
                    [ EX VENTURE ]
                   /       |       \
          [Seraph 🌿]  [X150 ♻️]  [AI & Auto 🤖]
           /     \         |        /          \
    [Lit Val] [Pilot]   [CFD]  [IntelliBot]  [Workflows]
        |                           |
   [Presets]               [GSD Integration]
                                    |
                           [PnP / A2A / Toon]
```

**Node states (visual):**
- Solid filled + colour = ✅ Complete
- Pulsing outer ring = 🔄 Active / in progress
- Outline only = ⬜ Pending
- Dashed outline = 💡 Idea / consideration (from Idea Branching)

**Progress:** Radial ring around each project node showing phase % completion.

**Interaction:**
- Click project node → expands phases inline
- Click phase node → shows recent log entries for that phase
- Click idea node → shows consideration sub-branches
- Drag to rearrange (D3 force layout)
- Hover → tooltip with last update + owner

**Node colour coding:**
- 🌿 Green = Science team (Seraph, X150)
- 🟣 Purple = AI & Automation
- 🔵 Cyan = Crossover / shared

**Tech:** D3.js v7 force-directed graph, SVG-based.
**Effort:** High. Build as a standalone component, then embed in the tracker.
**Skills needed:** `web-artifacts-builder` for the React shell, D3 for the graph.

---

### 🚀 Vercel Deployment
**Status:** 💡 Idea
**Priority:** High
**Decisions needed:**
- Data: Static HTML is instant on Vercel but localStorage is per-device (not shared). Need Supabase for real shared state.
- Auth: Vercel password protection (free, instant) → or passcode modal in the UI
- Repo: New `exventure-engineering-tracker` repo, or nest inside Miguel's GSD repo?
**Suggested path:** 1) Push current HTML to Vercel as static (immediate team access), 2) Add Supabase in v2, 3) OpenClaw API in v3.

---

### 🔗 OpenClaw / IntelliBot Integration
**Status:** 💡 Idea — needs API schema agreement with Nida
**Priority:** High
**What IntelliBot should be able to do:**
- `POST /api/log` → auto-log agent task completions into the tracker
- `GET /api/projects` → read current project states + phases
- `GET /api/members` → know who's on what team
- `POST /api/idea` → IntelliBot can submit ideas/flags to the Idea tree
- `PATCH /api/phase` → update phase status when a milestone is hit
**How:** Vercel Edge Functions (if static deploy) or FastAPI on IntelliBot's infra.
**Owner:** Nida (IntelliBot side) + Miguel (tracker API side)
**Note:** The GSD protocol Nida is building should align with the task event schema here.

---

### 💡 Idea Branching / Consideration Tree
**Status:** 💡 Idea
**Priority:** Medium
**What:** A dedicated "Ideas" tab in the tracker where anyone can:
- Submit a raw idea directly in the web app
- System auto-creates 3 consideration branches: **Feasibility**, **Effort**, **Impact**
- Team members can add notes to any branch
- Idea can be "graduated" → becomes a new project phase or task (with one click)
- Graduated ideas get a node in the spiderweb
**Visual:** Each idea is its own mini-spiderweb. The central node is the idea title; branches are the three considerations.
**Input methods:** Web form in the tracker OR relayed through Miguel via Cowork chat OR IntelliBot POST
**Brainstormed sub-ideas:**
  - Tag ideas by project (Seraph / X150 / AI / Cross-team)
  - Vote system (👍 count per idea)
  - "Consideration" comments threaded under each branch
  - Archive ideas that are dropped (don't delete, keep history)

---

### 💬 Persistent Memory / Chat-Deployable System
**Status:** 🔄 In Progress (v1 done via CONTEXT.md + IDEAS.md)
**Priority:** High
**Current state:** CONTEXT.md + IDEAS.md in workspace = Claude's persistent memory. Re-read at start of each session.
**Next:** Formalise a session start prompt: *"Read CONTEXT.md and IDEAS.md, load team state, and resume."*
**Future:** IntelliBot can also read these files and maintain its own persistent understanding of team state.
**Key insight:** The tracker isn't just a dashboard — it's a shared memory layer for both humans and AI agents.

---

### 🧩 /brainstorm Skill (to build)
**Status:** 💡 Needs building via `skill-creator`
**Priority:** Medium
**What:** A Claude Cowork skill that:
- Takes a topic or challenge
- Generates a structured idea tree (main idea → branches → considerations)
- Formats output as a mini-spiderweb description + bullet tree
- Optionally appends directly to IDEAS.md under a timestamped session
- Can tag ideas to a project (Seraph / X150 / AI)
**Build path:** `skill-creator` → write SKILL.md → test → install

---

### 🗂️ /gsd:new-project (to build)
**Status:** 💡 Needs building via `skill-creator`
**Priority:** Medium
**What:** A skill that walks through creating a new project:
- Prompts: name, code name, team, description, phases (up to 6), end goal
- Writes to CONTEXT.md
- Appends to PROJECTS array in the tracker HTML
- Logs a "🆕 Project Created" entry in the weekly log
- Adds a node to the spiderweb (once that's built)
**Note:** This integrates GSD repo commands with the tracker.

---

### 🎨 Frontend Design Polish (theme-factory)
**Status:** 💡 Idea
**Priority:** Medium — do after spiderweb is built
**What:** Run `theme-factory` to apply an EX Venture brand theme:
- Define EX colour palette (dark bg, green for Science, purple for AI, cyan for crossover)
- Better typography (Inter or Geist)
- Smooth animated transitions on progress bars and node states
- Mobile-first responsive spiderweb
**Note:** The dark theme already feels right. Focus on refinement not overhaul.

---

### 📊 Weekly Summary Auto-Report (schedule skill)
**Status:** 💡 Idea
**Priority:** Low
**What:** Every Friday, auto-generate a Markdown or PDF summary of the week:
- Table per team: who did what, which phase they touched
- Highlights (completed phases, shipped things)
- Blockers flagged
- Next week intentions from log entries
**Trigger:** Miguel says "generate this week's report" OR scheduled via `schedule` skill
**Output:** PDF (using `pdf` skill) + append to a `WEEKLY-REPORTS/` folder in the workspace

---

## Decisions Log

| Date | Decision | Made by |
|---|---|---|
| 2026-02-27 | Project names: Seraph = duckweed, X150 = waste to energy | Miguel |
| 2026-02-27 | Julien = CEO of Ex-Venture | Miguel |
| 2026-02-27 | CONTEXT.md + IDEAS.md = persistent memory layer | Miguel + Claude |
| 2026-02-27 | Tracker v1 shipped: HTML, localStorage, 4 projects, 9 members, 5 log entries | Claude |
| 2026-02-27 | GSD = Miguel's personal productivity repo, not the tracker name | Miguel |
| 2026-02-27 | Tracker name = **Ex-Venture Engineering Team Tracker** | Miguel |
| 2026-02-27 | Miguel's Seraph sim noted as distinct workstream (3D physics engine, lit validation) | Miguel |

---

## Build Order (recommended)

1. **Now:** Vercel static deploy (get the team on it immediately, no backend needed yet)
2. **Next:** Spiderweb viz — D3 force graph, embed in tracker
3. **Then:** Supabase backend — shared persistence, ditch localStorage
4. **Then:** OpenClaw API endpoint — IntelliBot starts posting to tracker
5. **Then:** Idea Branching tab — team submits ideas directly
6. **Then:** `/brainstorm` + `/gsd:new-project` skills
7. **Then:** theme-factory polish + mobile
8. **Later:** Weekly PDF auto-report via `schedule` skill

---

## Parking Lot
- Slack / Teams integration to auto-ingest updates
- Role-based access (Julien = CEO summary view, team = full detail)
- Time estimates + deadline tracking per phase
- GitHub integration: auto-log commits as progress entries
- Equation Labs reporting tracker (Arvin's audit workflow)
