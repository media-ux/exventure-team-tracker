# Architecture Research

**Domain:** Team Tracker with Slack Integration and Distributed AI Agent Sync
**Researched:** 2026-02-27
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  React + Vite    │  │  D3.js Canvas    │  │  Tailwind +      │  │
│  │  Components      │  │  Force Graph     │  │  shadcn/ui       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │             │
│           └─────────────────────┴─────────────────────┘             │
│                                 │                                   │
│                      WebSocket + REST API                           │
│                                 │                                   │
├─────────────────────────────────┴───────────────────────────────────┤
│                         APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Vercel Edge │  │  Message     │  │  Slack Events API        │  │
│  │  Functions   │  │  Queue       │  │  (Webhook Handler)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         └─────────────────┴──────────────────────┘                  │
│                           │                                         │
│              ┌────────────┴─────────────┐                           │
│              │                          │                           │
│  ┌───────────▼──────────┐  ┌───────────▼───────────────┐           │
│  │  Agent Sync Service  │  │  Real-time Subscription   │           │
│  │  (Bidirectional)     │  │  Manager                  │           │
│  └───────────┬──────────┘  └───────────┬───────────────┘           │
├──────────────┴─────────────────────────┴─────────────────────────┤
│                            DATA LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Supabase (PostgreSQL + Realtime)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │ Teams Table  │  │ Projects     │  │ Tasks Table  │        │  │
│  │  │ + RLS        │  │ Table + RLS  │  │ + RLS        │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                      EXTERNAL INTEGRATIONS                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐         ┌───────────────────────────┐    │
│  │  Slack Workspace     │         │  OpenClaw Agents          │    │
│  │  (Event Source)      │         │  (Mac Minis)              │    │
│  │                      │         │  - Seraph Agent           │    │
│  └──────────────────────┘         │  - X150 Agent             │    │
│                                   └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| React Components | UI state management, user interactions | Vite + React 18+ with hooks |
| D3.js Force Graph | Zoomable spiderweb visualization with physics simulation | Canvas-based rendering for performance, WebGL for 10k+ nodes |
| Supabase Realtime | WebSocket-based real-time subscriptions to database changes | Phoenix Channels over WebSocket, Postgres WAL streaming |
| Message Queue | Decouples event ingestion from processing, handles retries | Vercel Edge Functions + Redis/Upstash for persistence |
| Slack Webhook Handler | Receives Slack events, acknowledges immediately, queues for processing | HTTP endpoint responding <3s, async processing |
| Agent Sync Service | Bidirectional sync between Supabase and OpenClaw agents on Mac minis | Polling + webhook hybrid with conflict resolution |
| Row Level Security | Multi-tenant data isolation at database level | PostgreSQL RLS policies using auth.jwt() claims |

## Recommended Project Structure

```
ex-venture-tracker/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── spiderweb/       # D3.js force graph components
│   │   │   │   ├── ForceGraph.tsx       # Main graph container
│   │   │   │   ├── GraphRenderer.tsx    # D3 rendering logic (separate from React)
│   │   │   │   └── useGraphData.ts      # Hook for graph data + subscriptions
│   │   │   ├── dashboard/       # Dashboard UI
│   │   │   └── common/          # Shared UI components (shadcn/ui)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useSupabase.ts   # Supabase client + auth
│   │   │   └── useRealtime.ts   # Real-time subscription management
│   │   ├── services/            # API clients
│   │   │   ├── supabase.ts      # Supabase queries
│   │   │   └── api.ts           # REST API client
│   │   ├── types/               # TypeScript types (shared schema)
│   │   └── lib/                 # Utilities
│   └── public/
├── backend/                     # Serverless functions (Vercel)
│   ├── api/
│   │   ├── slack/
│   │   │   ├── events.ts        # Slack Events API webhook
│   │   │   └── oauth.ts         # Slack OAuth flow
│   │   ├── agents/
│   │   │   ├── sync.ts          # Agent sync endpoint
│   │   │   └── webhook.ts       # Webhook receiver for agent events
│   │   └── health.ts            # Health check
│   └── lib/
│       ├── queue.ts             # Message queue abstraction
│       ├── slack.ts             # Slack SDK wrapper
│       └── agents.ts            # Agent sync logic
├── supabase/                    # Supabase schema and migrations
│   ├── migrations/              # SQL migration files
│   ├── seed.sql                 # Seed data
│   └── config.toml              # Supabase config
└── shared/                      # Shared types and utilities
    └── schema.ts                # Unified TypeScript schema
```

### Structure Rationale

- **frontend/src/components/spiderweb/:** Separates D3.js rendering logic from React component lifecycle to avoid performance issues. GraphRenderer.tsx owns D3 mutations; ForceGraph.tsx is pure React wrapper.
- **backend/api/:** Serverless functions deployed as Vercel Edge Functions. Each integration (Slack, agents) has its own namespace for clarity.
- **shared/:** Schema-first approach prevents drift between frontend, backend, Slack bot, and OpenClaw agents.
- **supabase/:** Database as source of truth. Migrations ensure schema versioning.

## Architectural Patterns

### Pattern 1: Event-Driven with Message Queue

**What:** Decouple event ingestion (Slack webhooks, agent updates) from event processing using a message queue.

**When to use:** When external systems send events faster than you can process them, or when processing might fail and needs retries.

**Trade-offs:**
- **Pros:** Prevents timeouts, allows horizontal scaling of processors, enables retry logic with exponential backoff
- **Cons:** Adds complexity (queue infrastructure), eventual consistency (events processed async), requires idempotency handling

**Example:**
```typescript
// Slack webhook handler (responds <3s)
export default async function handler(req: Request) {
  const event = await req.json();

  // Acknowledge immediately
  if (event.type === 'url_verification') {
    return new Response(event.challenge);
  }

  // Queue for async processing
  await messageQueue.enqueue({
    type: 'slack_event',
    payload: event,
    timestamp: Date.now()
  });

  return new Response('OK', { status: 200 });
}

// Separate processor (runs async)
async function processSlackEvent(job) {
  const { payload } = job;

  // Parse message, extract tasks, update Supabase
  await supabase
    .from('tasks')
    .upsert(extractedTasks, { onConflict: 'external_id' });
}
```

### Pattern 2: Hybrid Polling + Webhooks for Bidirectional Sync

**What:** Use webhooks for Supabase → Agent updates (push), polling for Agent → Supabase updates (pull with fallback).

**When to use:** When one side (Mac mini agents) is behind NAT/firewall and cannot receive webhooks, but the other side (Supabase) can.

**Trade-offs:**
- **Pros:** Works around network constraints, polling provides fallback if webhooks fail
- **Cons:** Polling adds latency (typically 30s-60s intervals), higher resource usage than pure webhooks

**Example:**
```typescript
// Supabase → Agent (webhook push)
supabase
  .channel('task_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tasks' },
    async (payload) => {
      // Push to agent via webhook
      await fetch(`${AGENT_URL}/webhook/task-update`, {
        method: 'POST',
        body: JSON.stringify(payload.new)
      });
    }
  )
  .subscribe();

// Agent → Supabase (polling)
setInterval(async () => {
  const agentTasks = await fetchAgentTasks();
  const lastSync = await getLastSyncTimestamp();

  const updates = agentTasks.filter(t => t.updated_at > lastSync);

  if (updates.length > 0) {
    await supabase.from('tasks').upsert(updates, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
  }
}, 30000); // Poll every 30s
```

### Pattern 3: React + D3.js Separation of Concerns

**What:** Let React own component state and lifecycle; let D3 own SVG/Canvas mutations. Minimize re-renders by only updating D3 on data changes or resize.

**When to use:** Always, when combining React and D3 for visualizations.

**Trade-offs:**
- **Pros:** Prevents expensive D3 re-renders on every React update, clearer separation of responsibilities
- **Cons:** Requires understanding both React and D3 lifecycles, more boilerplate

**Example:**
```typescript
// ForceGraph.tsx (React wrapper)
function ForceGraph({ data }: { data: GraphData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize D3 simulation once
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new GraphRenderer(canvasRef.current, dimensions);
    renderer.initialize(data);

    return () => renderer.destroy();
  }, []); // Empty deps = mount once

  // Update D3 only when data changes
  useEffect(() => {
    const renderer = GraphRenderer.getInstance();
    renderer?.updateData(data);
  }, [data]);

  // Update D3 on resize
  useEffect(() => {
    const renderer = GraphRenderer.getInstance();
    renderer?.resize(dimensions);
  }, [dimensions]);

  return <canvas ref={canvasRef} />;
}

// GraphRenderer.ts (Pure D3 logic)
class GraphRenderer {
  private simulation: d3.Simulation;

  initialize(data: GraphData) {
    this.simulation = d3.forceSimulation(data.nodes)
      .force('charge', d3.forceManyBody())
      .force('link', d3.forceLink(data.links))
      .on('tick', () => this.render());
  }

  updateData(data: GraphData) {
    // Update simulation with new data without full re-init
    this.simulation.nodes(data.nodes);
    this.simulation.force('link').links(data.links);
    this.simulation.alpha(0.3).restart();
  }
}
```

### Pattern 4: Row Level Security for Multi-Tenant Isolation

**What:** Use PostgreSQL RLS policies to ensure team members only see data for their projects/teams, enforced at database level.

**When to use:** Always, for multi-tenant SaaS applications where security is critical.

**Trade-offs:**
- **Pros:** Security enforced at DB level (can't bypass with bad query), simpler application code (no manual filtering)
- **Cons:** More complex queries (RLS adds WHERE clauses), requires careful policy design, harder to debug

**Example:**
```sql
-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tasks for their teams
CREATE POLICY "Users can view own team tasks"
  ON tasks FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update tasks they're assigned to
CREATE POLICY "Users can update assigned tasks"
  ON tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );
```

## Data Flow

### Request Flow: Slack Message → Dashboard Update

```
[User posts in Slack]
    ↓
[Slack Events API] → POST /api/slack/events
    ↓
[Webhook Handler] → Acknowledge <3s (HTTP 200)
    ↓
[Message Queue] → Enqueue event
    ↓
[Background Processor] → Parse message, extract task
    ↓
[Supabase] → INSERT into tasks table
    ↓ (postgres_changes event)
[Supabase Realtime] → Broadcast to subscribed clients
    ↓ (WebSocket)
[React Dashboard] → useRealtime hook receives update
    ↓
[D3.js Force Graph] → updateData() adds new node
```

### Request Flow: User Updates Task → Agent Sync

```
[User edits task in UI]
    ↓
[React Component] → Calls Supabase client
    ↓
[Supabase API] → UPDATE tasks SET ... WHERE id = ?
    ↓ (RLS policy checks auth.uid())
[PostgreSQL] → Updates row if authorized
    ↓ (postgres_changes event)
[Supabase Realtime] → Triggers subscription
    ↓ (WebSocket to agent sync service)
[Agent Sync Service] → POST to agent webhook
    ↓
[OpenClaw Agent] → Updates local CONTEXT.md
```

### State Management Flow

```
[Supabase Database] (Source of truth)
    ↓ (Real-time subscription)
[React Query / SWR] (Client-side cache)
    ↓ (provides data to)
[React Components] (UI State)
    ↓ (user actions)
[Supabase Client] → Mutations
    ↓
[Supabase Database] (loop)
```

### Key Data Flows

1. **Slack → Dashboard (Event-Driven):** Slack sends webhook → Queue → Processor → Supabase → Real-time → UI update. Latency: 1-3 seconds.
2. **Dashboard → Agent (Hybrid):** User edits task → Supabase update → Real-time event → Webhook to agent (push). Fallback: Agent polls every 30s.
3. **Agent → Dashboard (Polling):** Agent updates local state → Polling service fetches changes → Upsert to Supabase → Real-time → UI update. Latency: 30-60 seconds.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | Monolithic Vercel deployment, single Supabase instance, polling every 60s for agents |
| 100-1k users | Add Redis message queue (Upstash), optimize D3.js to use Canvas instead of SVG, reduce polling to critical data only |
| 1k-10k users | Implement connection pooling for Supabase (PgBouncer), use WebGL for force graph (react-force-graph library), add CDN caching for static assets |
| 10k+ users | Consider dedicated PostgreSQL read replicas, move background processors to separate worker tier, implement rate limiting per team |

### Scaling Priorities

1. **First bottleneck: D3.js rendering with >1000 nodes**
   - **Symptom:** UI becomes sluggish, graph updates lag
   - **Fix:** Switch from SVG to Canvas rendering, implement virtualization (only render visible nodes), use WebGL for 10k+ nodes
   - **Confidence:** HIGH (verified via [React force graph benchmarks](https://github.com/vasturiano/react-force-graph))

2. **Second bottleneck: Supabase connection limits**
   - **Symptom:** Connection pool exhaustion errors, timeouts on queries
   - **Fix:** Implement connection pooling (PgBouncer), optimize real-time subscriptions (consolidate channels), use prepared statements
   - **Confidence:** HIGH (verified via [Supabase docs on scaling](https://supabase.com/docs/guides/realtime/benchmarks))

3. **Third bottleneck: Slack rate limits (30k events/hour)**
   - **Symptom:** app_rate_limited events from Slack, dropped messages
   - **Fix:** Implement backpressure (queue fills up → pause subscriptions), batch updates, request rate limit increase from Slack
   - **Confidence:** MEDIUM (based on [Slack Events API limits](https://docs.slack.dev/apis/events-api/))

## Anti-Patterns

### Anti-Pattern 1: Processing Slack Events Synchronously in Webhook Handler

**What people do:** Receive Slack event, parse message, query Supabase, respond to Slack — all in the webhook handler.

**Why it's wrong:** Slack requires response <3 seconds or retries. Complex processing (LLM parsing, multiple DB queries) can exceed this, causing duplicate events.

**Do this instead:** Acknowledge immediately (HTTP 200), enqueue event, process asynchronously. Use message queue pattern.

**Confidence:** HIGH (verified via [Slack Events API docs](https://docs.slack.dev/apis/events-api/))

### Anti-Pattern 2: Storing Agent State Only in OpenClaw File System

**What people do:** Agents maintain authoritative state in local CONTEXT.md files, sync to Supabase as backup.

**Why it's wrong:** Creates two sources of truth, conflicts during bidirectional sync, difficult to query/visualize from dashboard.

**Do this instead:** Supabase is source of truth. Agents sync their state TO Supabase, read FROM Supabase. Local files are cache only.

**Confidence:** MEDIUM (based on [bidirectional sync best practices](https://dev3lop.com/bidirectional-data-synchronization-patterns-between-systems/))

### Anti-Pattern 3: Re-rendering Entire D3 Graph on Every React State Change

**What people do:** Wrap D3 logic inside React component, let React re-render trigger full D3 graph rebuild.

**Why it's wrong:** D3 force simulations are expensive. Re-initializing on every render causes performance degradation (janky UI).

**Do this instead:** Initialize D3 once in useEffect with empty deps. Update data via D3 API (updateData()) only when data prop changes.

**Confidence:** HIGH (verified via [React + D3 performance guides](https://dev.to/tibotiber/react-d3-js-balancing-performance-developer-experience-1b5g))

### Anti-Pattern 4: Using WebSocket Polling Instead of Supabase Realtime

**What people do:** Poll Supabase API every few seconds via REST to check for updates.

**Why it's wrong:** Wastes bandwidth, increases latency, higher load on database, misses intermediate states.

**Do this instead:** Use Supabase Realtime subscriptions for postgres_changes. Database pushes updates via WebSocket as they happen.

**Confidence:** HIGH (verified via [Supabase Realtime docs](https://supabase.com/docs/guides/realtime/architecture))

### Anti-Pattern 5: Ignoring Conflict Resolution in Bidirectional Sync

**What people do:** Simple last-write-wins without timestamps, no handling of simultaneous edits from agent and dashboard.

**Why it's wrong:** Data loss when agent and user edit same task simultaneously. Silent overwrites frustrate users.

**Do this instead:** Implement timestamp-based conflict resolution (updated_at field), optionally flag conflicts for manual review. Use Supabase upsert with onConflict strategy.

**Confidence:** MEDIUM (based on [bidirectional sync conflict resolution patterns](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/))

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Slack Events API | Webhook (push) | Requires public HTTPS endpoint, <3s response, exponential backoff retries |
| Supabase Realtime | WebSocket subscription | Phoenix Channels protocol, auto-reconnects, supports postgres_changes, broadcast, presence |
| OpenClaw Agents | Hybrid (webhook push + polling) | Agents behind NAT, cannot receive webhooks directly. Use polling as fallback. |
| Vercel Edge Functions | Serverless HTTP | Deploy webhook handlers, API routes. Global edge network for low latency. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Supabase | REST API + WebSocket | Supabase client handles auth (JWT), RLS enforced automatically |
| Backend ↔ Supabase | PostgreSQL client (service key) | Bypasses RLS for admin operations, use cautiously |
| Slack Bot ↔ Backend | HTTP webhooks | Slack pushes events, backend responds. Use message queue to decouple. |
| Agent Sync ↔ Supabase | REST API + polling | Agents poll for updates every 30-60s, push updates via API |
| Dashboard ↔ D3.js | React props + refs | Pass data as props, access canvas via ref. Minimize re-renders. |

## Build Order Recommendations

Based on architectural dependencies:

### Phase 1: Foundation (Database + Auth)
- **Why first:** Everything depends on schema and authentication
- **Components:** Supabase setup, schema design, RLS policies, auth flow
- **Deliverable:** Working database with auth, can query via Supabase client

### Phase 2: Basic UI + Real-time
- **Why second:** Validates core user experience and real-time subscriptions
- **Components:** React app, basic dashboard, Supabase Realtime integration
- **Deliverable:** Dashboard showing live data from database

### Phase 3: Spiderweb Visualization
- **Why third:** Complex UI, depends on Phase 2's data layer
- **Components:** D3.js force graph, zoomable navigation, team member mapping
- **Deliverable:** Interactive spiderweb showing projects/tasks/team

### Phase 4: Slack Integration
- **Why fourth:** External dependency, can be built in parallel with Phase 3
- **Components:** Slack bot, Events API webhook, message queue, event parser
- **Deliverable:** Tasks auto-created from Slack messages

### Phase 5: Agent Sync
- **Why last:** Most complex, depends on stable schema and sync patterns
- **Components:** Agent webhook handler, polling service, conflict resolution
- **Deliverable:** Bidirectional sync between Supabase and OpenClaw agents

### Parallel Tracks Possible
- Phase 2 (UI) can start before Phase 1 is 100% complete (mock data initially)
- Phase 3 (Spiderweb) and Phase 4 (Slack) can be built in parallel after Phase 2
- Phase 5 (Agents) requires Phase 1-2 complete, can overlap with Phase 4

## Sources

**Supabase Realtime Architecture (HIGH confidence):**
- [Supabase Realtime Architecture Docs](https://supabase.com/docs/guides/realtime/architecture)
- [Supabase Realtime GitHub](https://github.com/supabase/realtime)
- [Building Scalable Real-Time Systems with Supabase](https://medium.com/@ansh91627/building-scalable-real-time-systems-a-deep-dive-into-supabase-realtime-architecture-and-eccb01852f2b)

**Slack Events API (HIGH confidence):**
- [Slack Events API Official Docs](https://docs.slack.dev/apis/events-api/)
- [Webhook Architecture Patterns for Real-Time Integrations](https://technori.com/news/webhook-architecture-real-time-integrations/)
- [Building a Slack Bot Using Events API](https://www.ory.com/blog/building-slack-bot-using-slack-events-api)

**Distributed Agent Sync (MEDIUM confidence):**
- [Google's Eight Essential Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [Event-Driven Multi-Agent Systems](https://www.confluent.io/blog/event-driven-multi-agent-systems/)
- [Bidirectional Data Synchronization Patterns](https://dev3lop.com/bidirectional-data-synchronization-patterns-between-systems/)
- [Offline Sync & Conflict Resolution Patterns (Feb 2026)](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/)

**React + D3.js Architecture (HIGH confidence):**
- [React + D3: Balancing Performance & Developer Experience](https://dev.to/tibotiber/react-d3-js-balancing-performance-developer-experience-1b5g)
- [Building Real-Time Dashboards with D3.js](https://reintech.io/blog/designing-real-time-data-dashboards-d3-js)
- [react-force-graph Library](https://github.com/vasturiano/react-force-graph)

**Event-Driven Architecture (HIGH confidence):**
- [Designing a Webhook Service](https://dev.to/vikthurrdev/designing-a-webhook-service-a-practical-guide-to-event-driven-architecture-3lep)
- [Event-Driven Architecture with Message Queues](https://dev.to/outdated-dev/event-driven-architecture-part-1-message-queues-and-topics-32pb)
- [Polling vs Webhooks](https://www.merge.dev/blog/webhooks-vs-polling)

**Supabase RLS Multi-Tenancy (HIGH confidence):**
- [Supabase Row Level Security Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)

---
*Architecture research for: Ex-Venture Engineering Team Tracker v2*
*Researched: 2026-02-27*
