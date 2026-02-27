# Project Research Summary

**Project:** Ex-Venture Engineering Team Tracker v2
**Domain:** Engineering team tracker with Slack integration, network visualization, and distributed AI agent sync
**Researched:** 2026-02-27
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is an internal engineering team tracker with three distinctive characteristics: real-time Slack integration for automatic task extraction, a zoomable "spiderweb" network visualization showing hierarchical relationships (company → project → sub-unit → task → file), and bidirectional sync with AI agents running on Mac minis. The recommended approach is a React SPA with Vite, Supabase for backend and real-time capabilities, D3.js for force-directed graph visualization, and serverless Slack bot processing on Vercel.

The architecture follows event-driven patterns with message queues for Slack webhook processing, hybrid polling/webhook sync for AI agents (since they're behind NAT), and careful separation of React and D3.js rendering concerns for performance. The stack prioritizes speed and developer experience—Vite for instant HMR, Zustand for lightweight state management, TanStack Query for server state caching, and shadcn/ui for production-quality components without vendor lock-in.

Key risks include D3.js performance degradation beyond 1,000 nodes (mitigate with Canvas rendering and progressive disclosure), Slack API rate limits for non-Marketplace apps (1 req/min for conversation history after March 2026), memory leaks from unsubscribed Supabase Realtime channels (enforce cleanup in useEffect), and LLM parsing accuracy degradation with messy real-world Slack messages (use OpenAI Structured Outputs with validation). The critical architectural decision is making Supabase the single source of truth—both dashboard and agents read/write to it, avoiding the two-sources-of-truth problem common in bidirectional sync systems.

## Key Findings

### Recommended Stack

The research strongly recommends a modern React stack optimized for speed: React 19 with TypeScript, Vite 7 for 40x faster builds than Create React App, and Supabase as a backend-as-a-service eliminating custom backend development. For the distinctive spiderweb visualization, D3.js 7.9 provides the force-directed graph engine with react-force-graph wrapping it for React integration. Slack integration uses the official @slack/bolt framework (required—legacy bots deprecated May 2026), and OpenAI's structured outputs with Zod schemas ensure reliable message parsing.

**Core technologies:**
- **React 19 + TypeScript + Vite**: Type-safe component development with near-instant HMR and optimized production builds via Rollup
- **Supabase (PostgreSQL + Realtime)**: Eliminates backend overhead while providing real-time subscriptions via WebSocket, auto-generated REST API, and Row-Level Security for multi-tenant isolation
- **D3.js + react-force-graph**: Industry standard for force-directed network visualizations, with Canvas rendering option for 10k+ nodes
- **@slack/bolt**: Official Slack framework with automatic OAuth/rate-limiting/retry handling, Events API support for real-time message processing
- **OpenAI + Zod**: Structured outputs ensure reliable parsing of Slack messages into typed data, with runtime validation matching TypeScript types
- **Zustand + TanStack Query**: Minimal-boilerplate state management (Zustand for UI state, TanStack Query for server state with smart caching)
- **Tailwind CSS + shadcn/ui**: Rapid UI development with copy-paste components (no dependency lock-in), built on Radix UI for accessibility
- **Vercel Serverless Functions**: Zero-config deployment with GitHub integration, serverless functions for Slack webhooks (NOT Edge Functions—deprecated in 2026)

**What NOT to use:** Create React App (unmaintained), Moment.js (68KB bundle), Axios (native fetch is sufficient), Chart.js/ApexCharts (designed for charts not network graphs), Slack legacy bot APIs (May 2026 sunset), CSS-in-JS (runtime cost), Vercel Edge Functions (deprecated).

### Expected Features

Research identifies clear table stakes versus differentiators. Missing table stakes makes the product feel incomplete, while differentiators provide competitive advantage without being expected by users.

**Must have (table stakes):**
- Task/Work Item Creation and Assignment — core CRUD operations with ownership tracking
- Status Tracking (backlog → in progress → blocked → done) — standard workflow states users expect
- Real-time Updates — in 2026, users expect instant sync without manual refresh (WebSocket/SSE)
- Visual Dashboard — single-pane view of project health and team activity
- Authentication & Access Control — secure login, role-based permissions even for internal tools
- Integration with Slack — teams live in Slack, tracker must connect bidirectionally
- Search and Filtering — finding specific tasks/projects quickly is expected
- Mobile Responsive Design — users check status on phones and tablets
- Team Member List and Task Dependencies — visibility into who's on the team and what blocks what

**Should have (competitive differentiators):**
- Zoomable Spiderweb/Network Visualization — unique way to see entire project hierarchy with force-directed graph, semantic zoom, interactive dragging
- NLP-Powered Slack Bot for Auto-Task Extraction — automatically parses chat messages to detect tasks, reducing manual data entry friction
- Bidirectional AI Agent Sync — OpenClaw agents on Mac minis read/write to tracker, enabling AI agents to update progress in same view as humans
- Visual Workload Heatmap with Color Coding — instant visibility into team capacity (green/yellow/red), drag-and-drop rebalancing
- Weekly/Monthly Archive Views — time-travel through project history with snapshot preservation, not just date filtering
- Hierarchical Drill-Down with Context Preservation — click into any node to zoom with breadcrumb trail and mini-map
- Unified Memory Layer for Humans + AI — single source of truth replacing fragmented CONTEXT.md files per agent

**Defer (v2+):**
- Advanced Analytics and AI Insights — requires historical data, add once product has been used for months
- Mobile Native App — web-first is explicitly in scope, native only if mobile usage is high and web experience inadequate
- Multi-Workspace Support — internal tool for one company, multi-tenancy adds significant complexity
- API for External Integrations — until users request specific integrations, internal tool doesn't need broad API
- Real-time Collaborative Editing — operational transform/CRDT complexity, not critical if updates sync within seconds via WebSocket

**Anti-features (avoid):**
- Real-time chat within tracker — dilutes focus, duplicates Slack, leads to context fragmentation
- Time tracking with timers — creates surveillance culture, engineers hate it, use estimate-based capacity planning instead
- Granular permissions (per-task, per-field) — complexity explosion for internal tool, use simple role-based access
- Gantt charts — engineering work is exploratory not assembly-line, use live network visualization instead
- Email notifications for everything — notification fatigue, use smart notifications only for blockers, overdue, @mentions

### Architecture Approach

The architecture follows event-driven patterns with clear separation of concerns. Slack webhooks are acknowledged immediately (<3 seconds) and queued for async processing to avoid timeouts and duplicates. AI agents use hybrid polling/webhook sync since Mac minis are behind NAT and can't receive webhooks. React and D3.js rendering are cleanly separated—React owns component lifecycle, D3 owns SVG/Canvas mutations, with updates only on data changes not every render.

**Major components:**
1. **React + Vite Frontend** — UI state management and user interactions, with WebSocket subscriptions to Supabase Realtime for live updates
2. **D3.js Force Graph with Canvas** — Zoomable spiderweb visualization with physics simulation, Canvas-based for performance with 1000+ nodes, WebGL option for 10k+ nodes
3. **Supabase (PostgreSQL + Realtime)** — Single source of truth for all data, Row-Level Security for multi-tenant isolation, WebSocket-based real-time subscriptions via Phoenix Channels
4. **Vercel Serverless Functions** — Slack Events API webhook handler, agent sync endpoints, message queue processor (NOT Edge Functions—deprecated)
5. **Message Queue (Redis/Upstash)** — Decouples event ingestion from processing, handles retries with exponential backoff, prevents Slack timeout issues
6. **Agent Sync Service** — Bidirectional sync: webhooks push Supabase → agents, polling pulls agents → Supabase (30-60s intervals), conflict resolution via timestamps
7. **Slack Bot (@slack/bolt)** — Receives Events API webhooks, parses messages with OpenAI Structured Outputs, creates tasks with validation

**Key patterns:**
- **Event-driven with message queue**: Slack sends webhook → acknowledge <200ms → queue → async processor → Supabase → Realtime → UI update (1-3s latency)
- **Hybrid polling + webhooks for agent sync**: Push Supabase → agents via webhook, pull agents → Supabase via polling (agents behind NAT can't receive webhooks)
- **React + D3.js separation**: Initialize D3 once in useEffect with empty deps, update via D3 API only on data changes, prevents expensive re-renders
- **Row Level Security (RLS) for multi-tenancy**: PostgreSQL RLS policies ensure team members only see their project data, enforced at database level

### Critical Pitfalls

Research identifies seven critical pitfalls with verified prevention strategies. Each has been cross-referenced against official documentation and real-world production issues.

1. **D3.js Force Graph SVG Element Limit (10k nodes)** — Graph becomes choppy/freezes beyond ~10k SVG elements. Hierarchical data explodes faster than expected (5 projects × 4 sub-units × 20 tasks × 5 files = 2,000 nodes). **Prevention:** Use Canvas rendering for >1,000 nodes (10-100x faster), implement progressive disclosure (render only current zoom level), set hard cap of 500-1000 visible nodes with culling. **Address in Phase 1 (Spiderweb UI).**

2. **Supabase Realtime Memory Leaks from Unsubscribed Channels** — Memory usage steadily increases, browser eventually slows/crashes. React useEffect requires explicit cleanup but developers forget to return cleanup function. Testing with hot-reload masks the issue. **Prevention:** Always return cleanup in useEffect that calls `channel.unsubscribe()` and `supabase.removeChannel()`, test with React StrictMode (forces double-mounting), use single channel per connection scope. **Address in Phase 2 (Supabase Setup).**

3. **Slack Bot Rate Limit Cascade (1 req/min for conversations.history)** — Starting March 2026, non-Marketplace apps limited to 1 request per minute for message history. Bot tries to backfill after downtime, hits 429 errors immediately, enters retry storm. **Prevention:** Use Events API instead of polling (real-time push), implement request queue with rate limiting matching retry-after header, avoid backfilling on startup, store cursor/timestamp and fetch only since last processed. **Address in Phase 3 (Slack Bot).**

4. **Webhook Idempotency Missing (Duplicate Task Creation)** — Slack retries webhooks after timeout/network issues. Without idempotency, tracker creates duplicate tasks and double-counts progress. **Prevention:** Acknowledge immediately (<200ms), use idempotency keys (store event.event_id in Redis/Postgres with TTL), queue-first pattern, database unique constraints on natural keys (slack_message_id). **Address in Phase 3 (Slack Bot).**

5. **D3.js Zoom Transform Order Breaks Centering** — Programmatic zoom doesn't center correctly. Calling `d3.zoomIdentity.scale(k).translate(x, y)` centers on wrong point. Matrix transformation order is non-commutative but API doesn't make this obvious. **Prevention:** Always use `translate().scale()` for centering (this is correct order for zoom-to-point), test at scale 0.5x, 1x, 2x to verify. **Address in Phase 1 (Spiderweb UI).**

6. **LLM Structured Extraction Degrades with Input Quality** — Slack bot message parsing works in tests (95% accuracy) but fails in production (60% accuracy). Real messages are messy: typos, abbreviations, emoji, thread context missing, ambiguous pronouns. LLMs hallucinate when uncertain—inventing assignees or dates. **Prevention:** Use OpenAI Structured Outputs with `strict: true`, check `message.refusal` field for ambiguous inputs, provide 3-5 previous messages for context, validate extracted data against known team members and date formats, show confidence scores and let users confirm/reject. **Address in Phase 3 (Slack Bot).**

7. **Row Level Security (RLS) Testing in SQL Editor Gives False Confidence** — Developer writes RLS policies, tests in Supabase SQL Editor, sees all data, assumes policies work. Deploys to production, users see nothing. SQL Editor uses postgres superuser role which bypasses all RLS policies. **Prevention:** Test RLS with actual roles (create test users, authenticate via API, run queries as authenticated role), use Supabase Test Suite for integration tests, enable RLS with FORCE on all tables, create indexes on policy columns (user_id, team_id). **Address in Phase 2 (Supabase Setup).**

## Implications for Roadmap

Based on architectural dependencies and risk mitigation, research suggests a 5-phase structure that builds foundation-first while enabling parallel work where possible.

### Phase 1: Foundation (Database + Auth)
**Rationale:** Everything depends on schema and authentication—no other features work without knowing who users are and how data is structured. This phase establishes the single source of truth (Supabase) and access control patterns that all subsequent phases rely on.

**Delivers:**
- Supabase project setup with PostgreSQL database
- Hierarchical schema (company → project → sub-unit → task → file structure)
- Row Level Security policies with multi-tenant isolation
- Authentication flow (email/password or SSO)
- Team member management (users, roles, permissions)

**Addresses (from FEATURES.md):**
- Authentication & Access Control (table stakes)
- Team Member List (table stakes)
- Foundation for all other features

**Avoids (from PITFALLS.md):**
- RLS testing blind spot — test policies with actual authenticated roles, not SQL Editor
- Missing RLS on new tables — enable RLS in all table creation scripts
- No indexes on RLS columns — add indexes on user_id, team_id upfront

**Research flag:** Standard patterns, skip research-phase. Well-documented Supabase setup with RLS examples in official docs.

---

### Phase 2: Core UI + Real-time
**Rationale:** Validates core user experience and real-time subscriptions before investing in complex visualizations. Establishes data fetching patterns, state management, and real-time update infrastructure that Phase 3 (Spiderweb) will build upon.

**Delivers:**
- React + Vite application with TypeScript
- Basic dashboard with task list/board views
- Supabase Realtime integration (WebSocket subscriptions)
- CRUD operations for tasks (create, assign, update status)
- Zustand for UI state, TanStack Query for server state
- Mobile responsive layout
- Real-time updates when data changes

**Uses (from STACK.md):**
- React 19 + TypeScript + Vite
- Zustand + TanStack Query
- @supabase-cache-helpers/postgrest-react-query (bridges Realtime → React Query cache)
- Tailwind CSS + shadcn/ui for UI components
- react-hook-form + Zod for task creation forms

**Implements (from ARCHITECTURE.md):**
- React frontend with Supabase client
- Real-time subscription management with cleanup patterns
- State management flow: Supabase → TanStack Query cache → React components

**Addresses (from FEATURES.md):**
- Task/Work Item Creation and Assignment (table stakes)
- Status Tracking (table stakes)
- Real-time Updates (table stakes)
- Visual Dashboard with list/board view (table stakes)
- Team Member Capacity View (MVP)
- Mobile Responsive Design (table stakes)

**Avoids (from PITFALLS.md):**
- Realtime memory leaks — establish cleanup patterns in custom useRealtimeSubscription hook
- Fetching all tasks on page load — implement pagination/virtualization from start
- No loading states — add spinners/skeletons for async operations

**Research flag:** Standard patterns, skip research-phase. React + Supabase is well-documented with established patterns.

---

### Phase 3: Spiderweb Visualization
**Rationale:** Complex UI feature that depends on Phase 2's data layer and real-time subscriptions. This is a core differentiator but can be built once foundation is solid. Requires careful performance consideration due to D3.js rendering constraints.

**Delivers:**
- D3.js force-directed graph showing hierarchy (company → projects → sub-units → tasks)
- Team member nodes mapped at every hierarchy level
- Click-to-zoom with semantic zoom (different detail levels)
- Interactive node dragging and pan
- Canvas rendering for performance (supports 1000+ nodes)
- Breadcrumb navigation and mini-map for context
- Real-time graph updates when data changes

**Uses (from STACK.md):**
- D3.js 7.9.0 for force simulation engine
- react-force-graph for React wrapper (production-ready, used by Airbnb)
- Canvas rendering (not SVG) to support 1000+ nodes

**Implements (from ARCHITECTURE.md):**
- React + D3.js separation of concerns pattern
- Progressive disclosure (render only current zoom level)
- Viewport culling (cap visible nodes at 500-1000)

**Addresses (from FEATURES.md):**
- Zoomable Spiderweb/Network Visualization (differentiator)
- Hierarchical Drill-Down with Context Preservation (differentiator)
- Team Member Mapping at Every Hierarchy Level (differentiator)

**Avoids (from PITFALLS.md):**
- SVG element limit — use Canvas rendering from start, not SVG
- Zoom transform order breaks centering — always use translate().scale() pattern
- Re-rendering entire graph on React state changes — initialize D3 once, update via D3 API only on data changes
- Force simulation runs continuously — stop simulation when alpha < alphaMin
- Graph nodes overlap/unreadable labels — collision detection, abbreviate labels, full text on hover
- Graph resets zoom on data update — maintain zoom/pan transform during updates

**Research flag:** NEEDS RESEARCH. D3.js force-directed graphs with React integration are complex. Recommend `/gsd:research-phase` to explore Canvas vs WebGL rendering options, semantic zoom implementation patterns, and performance optimization techniques for 1000+ node graphs.

---

### Phase 4: Slack Integration
**Rationale:** External dependency that can be built in parallel with Phase 3 after Phase 2 is complete. Requires careful handling of webhooks, rate limits, and async processing. This is table stakes for modern team tools—users expect Slack integration—but can wait until core tracker works.

**Delivers:**
- Slack bot setup with OAuth flow
- Events API webhook handler (acknowledges <3s)
- Message queue (Redis/Upstash) for async processing
- NLP-powered task extraction using OpenAI Structured Outputs
- Validation pipeline (check assignees exist, dates valid)
- Bidirectional Slack integration (tracker → Slack notifications, Slack → task creation)
- Idempotency handling to prevent duplicate tasks
- Rate limit handling with exponential backoff

**Uses (from STACK.md):**
- @slack/bolt 4.3.0 (official framework, required for post-May-2026)
- @slack/web-api 7.9.2
- openai 4.77.0 with Structured Outputs
- Zod 3.24.1 for schema validation
- Vercel Serverless Functions (NOT Edge Functions—deprecated)

**Implements (from ARCHITECTURE.md):**
- Event-driven with message queue pattern
- Webhook handler: acknowledge immediately → queue → async processor → Supabase → Realtime → UI
- Idempotency: store event.event_id in Redis with TTL

**Addresses (from FEATURES.md):**
- Integration with Communication Tools (table stakes)
- NLP-Powered Slack Bot for Auto-Task Extraction (differentiator)
- Bidirectional Slack Integration (v1.x feature)

**Avoids (from PITFALLS.md):**
- Processing Slack events synchronously — acknowledge <200ms, queue for async processing
- Slack rate limit cascade — use Events API (push) not polling, implement request queue with retry-after handling
- Webhook idempotency missing — store event_id, use database unique constraints on slack_message_id
- LLM extraction degrades with input quality — use Structured Outputs with strict mode, validate extracted data, show confidence scores
- Missing webhook signature verification — verify X-Slack-Signature header before processing
- No loading states during LLM parsing — show "Parsing..." message in Slack thread

**Research flag:** NEEDS RESEARCH. Slack Events API + OpenAI Structured Outputs + message queue architecture is complex. Recommend `/gsd:research-phase` to explore webhook retry patterns, idempotency key strategies, LLM prompt engineering for task extraction, and rate limit handling specific to March 2026 changes.

---

### Phase 5: Agent Sync
**Rationale:** Most complex feature, depends on stable schema from Phase 1 and sync patterns from Phase 2/4. Requires bidirectional sync with conflict resolution. This is a differentiator but can be deferred until core tracker is validated with human users.

**Delivers:**
- API authentication for AI agents (API keys)
- Agent webhook handler (receives updates from Supabase)
- Polling service (fetches agent updates every 30-60s)
- Conflict resolution (timestamp-based, last-write-wins with flagging)
- Unified memory layer (Supabase replaces fragmented CONTEXT.md files)
- Real-time notifications to agents when humans update tasks
- Agent activity visible in dashboard alongside human updates

**Uses (from STACK.md):**
- Supabase service role key (backend only, not exposed to browser)
- Node.js 20.19+ LTS for agent scripts
- Vercel Serverless Functions for agent webhooks

**Implements (from ARCHITECTURE.md):**
- Hybrid polling + webhooks pattern
- Supabase → Agent: webhook push via Realtime subscription
- Agent → Supabase: polling pull every 30-60s (agents behind NAT can't receive webhooks)
- Conflict resolution: updated_at timestamps, flag conflicts for manual review

**Addresses (from FEATURES.md):**
- Bidirectional AI Agent Sync (v2+ feature, deferred)
- Unified Memory Layer for Humans + AI (v2+ feature, deferred)

**Avoids (from PITFALLS.md):**
- Storing agent state only in OpenClaw filesystem — Supabase is source of truth, local files are cache only
- Ignoring conflict resolution — implement timestamp-based resolution, flag simultaneous edits for review
- No rate limiting on webhook endpoints — use Vercel rate limiting (100 req/min per IP)

**Research flag:** NEEDS RESEARCH. Bidirectional sync with distributed agents behind NAT is complex, sparse documentation. Recommend `/gsd:research-phase` to explore polling vs webhook trade-offs, conflict resolution strategies (CRDTs vs last-write-wins), and agent authentication patterns.

---

### Phase Ordering Rationale

**Foundation-first (Phase 1 → 2 → 3):** Database schema and auth must exist before anything else. Basic UI validates real-time patterns before investing in complex D3.js visualization. Spiderweb depends on data layer and real-time subscriptions being stable.

**Parallel tracks after Phase 2:** Phase 3 (Spiderweb) and Phase 4 (Slack Bot) can be built in parallel—they share Supabase as dependency but don't depend on each other. Team can split: one dev on visualization, one on Slack integration.

**Agent sync last (Phase 5):** Most complex feature with highest uncertainty. Requires stable schema (Phase 1), proven sync patterns (Phase 2), and ideally operational message queue from Slack work (Phase 4). Deferring to v2+ is reasonable—product provides value to human users without agent sync.

**Pitfall mitigation baked in:** Each phase explicitly addresses pitfalls discovered in research. Phase 1 prevents RLS testing blind spots, Phase 2 establishes Realtime cleanup patterns, Phase 3 chooses Canvas over SVG upfront, Phase 4 implements idempotency and rate limiting from day one, Phase 5 makes Supabase the single source of truth.

**MVP = Phases 1-2-3:** Core team tracker with real-time updates and distinctive spiderweb visualization. Delivers unique value without Slack or agent integration.

**V1 = Add Phase 4:** Slack integration makes it table stakes competitive with Linear/Asana but with unique spiderweb UX.

**V2 = Add Phase 5:** Agent sync transforms it into unified memory layer for human + AI collaboration. High complexity, defer until v1 is validated.

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 3 (Spiderweb Visualization):** Complex D3.js + React integration, performance optimization for 1000+ nodes, semantic zoom implementation. Niche domain (force-directed graphs with hierarchical data). **Recommend `/gsd:research-phase` before planning Phase 3.**

- **Phase 4 (Slack Integration):** Message queue architecture, webhook idempotency patterns, OpenAI Structured Outputs prompt engineering, Slack rate limit handling (March 2026 changes). Multiple integration points with subtle gotchas. **Recommend `/gsd:research-phase` before planning Phase 4.**

- **Phase 5 (Agent Sync):** Bidirectional sync with distributed systems, conflict resolution strategies, polling vs webhook trade-offs, agent authentication patterns. Sparse documentation for this specific use case. **Recommend `/gsd:research-phase` before planning Phase 5.**

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** Well-documented Supabase setup, standard RLS patterns in official docs, common auth flows. Community consensus on multi-tenant architecture with PostgreSQL RLS.

- **Phase 2 (Core UI):** Established React + Supabase patterns, TanStack Query is mature, Zustand is minimal-boilerplate. Supabase Realtime integration has official examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified via official documentation and npm registry. React 19 + Vite + Supabase + D3.js are mature with strong community support. Version compatibility confirmed. |
| Features | MEDIUM | Table stakes and differentiators identified through competitor analysis (Linear, Asana, Monday.com) and engineering dashboard research. MVP definition is clear. Anti-features are opinionated but well-justified. Limited primary user research—validated against industry patterns not specific user interviews. |
| Architecture | MEDIUM-HIGH | Event-driven patterns and React + D3.js separation are well-documented. Supabase Realtime architecture is official and verified. Hybrid polling/webhook sync for agents is based on general distributed systems patterns, not verified with OpenClaw-specific use case. Build order recommendations are logical but not validated against actual implementation timeline. |
| Pitfalls | HIGH | All seven critical pitfalls cross-referenced with official documentation (Slack API, Supabase Realtime, D3.js) and real-world production issues. Prevention strategies are specific and actionable. Warning signs and phase mapping are detailed. |

**Overall confidence:** MEDIUM-HIGH

Research is grounded in official documentation for core technologies (React, Vite, D3.js, Supabase, Slack API, OpenAI) with HIGH confidence. Architectural patterns and pitfalls are verified against production systems. Confidence is lower for features (MEDIUM) due to limited primary user research—recommendations based on competitor analysis and industry patterns rather than direct user interviews with EX Venture team. Agent sync patterns (Phase 5) have MEDIUM confidence due to OpenClaw-specific requirements not matching standard documented patterns.

### Gaps to Address

**During planning/execution:**

1. **User workflow validation:** Research assumed standard engineering team workflows based on Linear/Asana patterns. Validate with actual EX Venture team: How do they currently track work? What pain points exist? Do they want spiderweb visualization or is simpler list view sufficient? **Action:** User interviews before finalizing Phase 3 scope.

2. **Agent sync patterns:** Research found general bidirectional sync patterns but not OpenClaw-specific architecture. What is agent file structure? What APIs do agents expose? How do agents currently read/write CONTEXT.md? **Action:** Deeper research in Phase 5 planning, possibly prototype polling approach first.

3. **Scale expectations:** Research assumes 5 projects × 4 sub-units × 20 tasks = ~2,000 nodes. What is actual expected scale? 100 nodes (simple list view sufficient)? 10,000 nodes (WebGL required)? **Action:** Confirm with stakeholders before Phase 3 to right-size rendering approach.

4. **Slack workspace specifics:** Research assumes standard Slack setup. Does EX Venture have Slack Enterprise Grid (different permissions)? Any existing bots that might conflict? What channels should bot monitor? **Action:** Slack workspace audit before Phase 4.

5. **LLM cost at scale:** Research recommends OpenAI for message parsing. What is expected message volume? 10 messages/day (negligible cost)? 1000 messages/day (budget planning needed)? **Action:** Estimate costs and consider fallback to keyword extraction for low-priority channels.

6. **Semantic zoom implementation:** Research mentions "different detail levels based on zoom" but doesn't specify thresholds. At what zoom level do file nodes appear? When do task details show? **Action:** Design specification needed before Phase 3 implementation.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [React Official Docs](https://react.dev/) — React 19 features and hooks
- [Vite Getting Started](https://vite.dev/guide/) — Vite 7.3.1 setup and configuration
- [D3.js Official Site](https://d3js.org/) — D3.js 7.9.0 API reference
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — Real-time subscriptions and architecture
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) — Row Level Security patterns
- [Slack Developer Docs](https://docs.slack.dev/) — Events API, Bolt framework, rate limits
- [Slack Rate Limits Documentation](https://docs.slack.dev/apis/web-api/rate-limits/) — Verified March 2026 changes (1 req/min for non-Marketplace apps)
- [OpenAI Platform Docs](https://platform.openai.com/docs/quickstart) — API best practices and Structured Outputs
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs) — Schema validation with Zod
- [Zod Documentation](https://zod.dev/) — Schema validation and TypeScript integration
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/vite) — Vite setup with Tailwind
- [Vercel Functions Timeout Limits](https://vercel.com/docs/functions/limitations) — Serverless vs Edge Functions constraints
- [TanStack Query Documentation](https://tanstack.com/query/latest) — React Query v5 patterns
- [Zustand Documentation](https://zustand-demo.pmnd.rs/) — Minimal state management

**NPM Package Versions (verified 2026-02-27):**
- [react on npm](https://www.npmjs.com/package/react) — 19.2.4
- [vite on npm](https://www.npmjs.com/package/vite) — 7.3.1
- [d3 on npm](https://www.npmjs.com/package/d3) — 7.9.0
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js) — 2.98.0
- [@slack/bolt on npm](https://www.npmjs.com/package/@slack/bolt) — 4.3.0
- [openai on npm](https://www.npmjs.com/package/openai) — 4.77.0

### Secondary (MEDIUM confidence)

**Community Resources & Tutorials:**
- [How to Set Up a Production-Ready React Project with TypeScript and Vite](https://oneuptime.com/blog/post/2026-01-08-react-typescript-vite-production-setup/view)
- [How to Implement a D3.js Force-directed Graph in 2025](https://dev.to/nigelsilonero/how-to-implement-a-d3js-force-directed-graph-in-2025-5cl1)
- [React + D3: Balancing Performance & Developer Experience](https://dev.to/tibotiber/react-d3-js-balancing-performance-developer-experience-1b5g)
- [Building Real-Time Dashboards with React and WebSockets](https://www.wildnetedge.com/blogs/building-real-time-dashboards-with-react-and-websockets)
- [How to Use Supabase with TanStack Query (React Query v5)](https://makerkit.dev/blog/saas/supabase-react-query)
- [State Management in 2026: Redux vs Zustand vs Context API](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b)
- [Supabase Row Level Security Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Node.js Webhooks: Idempotency Patterns (2026)](https://medium.com/@Quaxel/node-js-webhooks-idempotency-patterns-that-save-you-769ae4bb4ebc)
- [Handling Rate Limits with Slack APIs](https://medium.com/slack-developer-blog/handling-rate-limits-with-slacks-apis-f6f8a63bdbdc)
- [React Hook Form + Zod Guide (2026 Edition)](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)

**Competitor Analysis:**
- [Linear vs Asana vs Monday.com: Project Management for AI Teams Comparison](https://getathenic.com/blog/linear-vs-asana-vs-monday-project-management-ai-teams-comparison)
- [The 10 best Linear alternatives for development teams in 2026](https://monday.com/blog/rnd/linear-alternatives/)
- [Engineering metrics: 30 essential KPIs for development teams in 2026](https://monday.com/blog/rnd/engineering-metrics/)

**Architecture Patterns:**
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Building Scalable Real-Time Systems with Supabase](https://medium.com/@ansh91627/building-scalable-real-time-systems-a-deep-dive-into-supabase-realtime-architecture-and-eccb01852f2b)
- [Bidirectional Data Synchronization Patterns](https://dev3lop.com/bidirectional-data-synchronization-patterns-between-systems/)
- [Event-Driven Architecture with Message Queues](https://dev.to/outdated-dev/event-driven-architecture-part-1-message-queues-and-topics-32pb)
- [Google's Eight Essential Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)

**Pitfalls & Performance:**
- [D3-Force Directed Graph Layout Optimization](https://dzone.com/articles/d3-force-directed-graph-layout-optimization-in-neb)
- [D3 Zoom — The Missing Manual](https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/)
- [Supabase Realtime Client-Side Memory Leak](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak)
- [Postgres RLS Implementation Guide - Common Pitfalls](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Offline Sync & Conflict Resolution Patterns (Feb 2026)](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/)

### Tertiary (LOW confidence)

**Blogs & Third-Party Comparisons:**
- [Top 10 Slack AI Bot Frameworks for Developers 2026](https://fast.io/resources/top-slack-ai-bot-frameworks/) — General overview, not specific to @slack/bolt
- [Best React chart libraries (2025 update)](https://blog.logrocket.com/best-react-chart-libraries-2025/) — Mentions D3 alternatives but focused on charts not network graphs

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
